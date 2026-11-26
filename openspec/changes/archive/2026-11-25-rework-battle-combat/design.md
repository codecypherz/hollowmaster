## Context

The current rules live in `src/services/game.service.ts`. `resolveBattles` recursively flips every
opposing neighbour a chevron points at whenever `roll(attack) > roll(defense)` (uniform ±20%), and
`lastFlipped` records the chain so `game.css` can stagger each `app-card`'s `is-flipped` animation
by `--flip-index × --stagger`. A placement resolves synchronously inside `placeCard`, and the
opponent moves after a fixed `OPPONENT_THINK_MS`. The match always opens on `'player-turn'`. The
opponent's hand comes from `dealHands(CARD_DB, 1, HAND_SIZE)` and ignores `RARITY_LIMIT`. Match
state is in-memory only and is never persisted.

The motion layer has three established patterns. Placement travel is measured from the vacated
hand slot in an `effect`. Captures are pure-CSS staggers. The scoreboard count-up uses a TS
constant that mirrors a motion token (`SCORE_STEP_MS` ↔ `--dur-instant`). Reduced motion is handled
per stylesheet with `@media (prefers-reduced-motion: reduce)`.

The new rules introduce three things the old shape cannot hold: a turn that **pauses** for the
player's choice, a per-turn **carried value** (the attacker's worn-down power), and an ordered
**event record** rich enough to present each combat (rolls and powers), not just a list of flipped
cells.

## Goals / Non-Goals

**Goals:**

- Combat rules as pure, deterministic-under-test functions, separate from the Angular service.
- One state machine for a placement's resolution that serves both the player (who pauses to
  choose) and the opponent (who chooses instantly).
- Presentation driven entirely by the recorded events. State changes are immediate and only the
  visuals are staged, so motion never gates interaction.

**Non-Goals:**

- Smarter opponent placement. The opponent still places in a random empty cell. Only its combat
  ordering gains a policy.
- Card abilities. The `ability` text remains flavour.
- Persisting a match, or showing a battle log beyond the current placement's presentation.
- Sound.

## Decisions

### 1. A pure combat module, `src/model/combat.ts`

The module holds the band table (`ROLL_BANDS`, stated once), `rollD100(rng)`,
`powerFor(stat, roll)`, `decideCombat(attacker, defender)`, and the resolution step functions
(decision 2). Every function that needs randomness takes an `rng: () => number`. Tests script exact
rolls instead of looping over `Math.random`.

A side's combat value is modelled as a tagged union, not a number:
`{ kind: 'outright-win' } | { kind: 'outright-loss' } | { kind: 'power'; value: number }`. A 100
has no numeric power under the user's ruling (a 100 sweeps the turn, a defender's 1 subtracts
nothing). Faking one with a sentinel such as `Infinity` would leak into the clash display and the
subtraction. Carrying forward is then explicit:

- an attacker with an outright win stays an outright win;
- otherwise its next power is `value − defender.value`, or unchanged if the defender rolled an
  outright loss.

Rounding is `Math.floor(stat × (1 + pct) + 0.5)`, i.e. halves round up, as the spec states.

*Alternative considered:* keep the rules inside `GameService` next to the signal. Rejected, because
the existing file already shows the problem: the rules can't be tested without the service, and
the opponent and player paths duplicate placement code.

### 2. Resolution as an explicit, resumable value

```
interface Resolution {
  at: Coord;                 // the attacker's cell
  side: Owner;               // who placed it
  combatTargets: Coord[];    // still to fight (pruned as combos take them)
  defenseless: Coord[];      // taken at the end if the attacker survives
  carried: CombatValue | null; // null until the attacker's first roll
}
```

- `beginResolution(board, at, side)` classifies targets: a chevron at an opposing neighbour that
  has the opposite chevron is a combat target, otherwise defenseless.
- `fight(board, res, target, rng)` returns `{ board, res | null, events }`. It rolls the attacker
  only when `carried` is null, rolls the defender, decides the combat, flips the loser, and applies
  the loser's one-step combo. It then prunes `combatTargets`/`defenseless` of anything no longer
  opposing. If the attacker lost, it returns `res: null` and the turn is over.
- `finish(board, res)` takes the remaining defenseless targets with no combo.

The service drives the machine. Zero or one combat target, or an opponent placement, runs straight
through. A player placement with two or more targets parks the `Resolution` in state under a new
phase, `'player-choosing'`, and `chooseCombat(row, col)` advances it. After each `fight` the
service re-checks: two or more targets left means stay in `'player-choosing'`, one means fight it,
none means `finish` and pass the turn.

*Alternative considered:* compute the whole turn up front from a list of choices. Rejected, because
the player has to see each combat's result before choosing the next. That is the point of letting
them choose.

### 3. An event record replaces `lastFlipped`

`GameState` gains `events: TurnEvent[]`, the current placement's record. Each event has a
monotonically increasing `seq`:

```
type TurnEvent =
  | { seq; kind: 'place'; at: Coord; side: Owner }
  | { seq; kind: 'combat'; attacker: Coord; defender: Coord;
      attackRoll: number; attack: CombatValue;     // attack = power carried in
      defenseRoll: number; defense: CombatValue; winner: 'attacker' | 'defender' }
  | { seq; kind: 'capture'; at: Coord; to: Owner; cause: 'combat' | 'combo' | 'defenseless' }
```

`lastPlaced` and `lastFlipped` become derivations of `events` (or are removed and their readers
updated), so there is one record. A `'place'` event resets the list. Later `chooseCombat` steps
append to it. `seq` lets the presentation play only the events it has not yet shown, even when one
placement arrives in several state updates.

### 4. First turn and the opponent deck

- `starTotal(cards)` and `decideFirstTurn(playerStars, opponentStars, rng)` live in
  `src/model/game.ts`. The result goes into state as
  `firstTurn: { first: Owner; playerStars; opponentStars; coinFlip: boolean }` for the
  announcement.
- `randomReadyDeck(db, rng): Deck` lives in `src/model/deck.ts`, beside the rule it must satisfy.
  It keeps `dealHands`' shuffle-through-the-pool behaviour so the spread stays varied, but skips any
  card at or above `RARITY_LIMIT.minStars` once `RARITY_LIMIT.allowed` such cards are held. It
  throws when the database holds no card below the threshold, which matches the spec's stated
  precondition. Its result is checked against `isBattleReady` in tests, so the oracle is the real
  deck rule rather than a restatement of it.
- When the opponent moves first, `startGame` sets `'opponent-turn'` and schedules the opponent's
  move exactly as after a player placement.

### 5. Randomness is injectable

A `GAME_RANDOM` injection token, `() => number`, defaults to `Math.random`. `GameService` reads it
and passes it to every roll, deal, coin flip, and empty-cell pick. Service specs provide a scripted
sequence. This replaces the current statistical tests ("outcomes vary"), which can't pin down band
edges or tie rules.

### 6. Opponent combat order: weakest defense first

When the opponent has two or more combat targets, it fights them in ascending base defense, with
ties broken by board order. Because attack wears down, beating the softest defender first keeps the
most power for the rest. It is simple, deterministic, and testable, and it reads as deliberate.

### 7. Presentation: a component-local event player, paced by CSS

`Game` gains a small sequencer that watches `state().events`, queues any event with
`seq > lastShown`, and plays them in order:

- **place** → the existing travel, followed by a new `is-landing` class on the cell. The landing
  plays a settle-and-impact keyframe and a ring of soul light from the cell, as an absolutely
  positioned pseudo-element so layout does not move.
- **combat** → sets an `activeClash` signal that renders a clash layer absolutely positioned over
  `.board` (never the codex) with `pointer-events: none`. It shows the two cards at a reduced size,
  an ATK/DEF label on each, both rolls revealing and then resolving to powers ("WIN"/"FAIL" for
  100/1), a strike flash, and the loser recoiling while the winner gets a "Victor" label. The
  winner label is text, so the outcome does not rely on colour. The queue advances on the clash
  element's final `animationend`.
- **capture** → adds the cell to a `revealedFlips` set, which applies `is-flipped` to that cell's
  `app-card`. Captures following a combat are released when that clash ends, with the existing
  `--stagger` between them.

All durations come from tokens. New tokens such as `--dur-clash` and `--dur-land` go in
`src/styles/tokens.css`. Advancing on `animationend` keeps the pace in CSS rather than mirrored in
TS. Under `prefers-reduced-motion`, the sequencer skips waiting: the clash renders its finished
state (rolls, powers, Victor), which holds until the next event, and every capture is revealed at
once. A new event arriving while the queue is busy flushes the current clash to its end state
rather than dropping it.

The model is already final when the visuals start. Cards are interactive in their new cells and
owners immediately, which is how the existing travel already satisfies "motion never gates
interaction".

*Alternative considered:* pure-CSS delays computed from each event's index (as `--flip-index` does
today). Rejected, because combats from a player-chosen sequence arrive in separate state updates,
and one clash's length depends on content (the reveal), so a single global index can't express it.

### 8. Choosing a combat on screen

In `'player-choosing'`, `Game.onCellActivate` calls `gs.chooseCombat` and inspects when the cell is
an offered target, and only inspects otherwise. Offered cells get a `cell-choosable` class: a
pulsing crossed-nail glyph plus an outline, so the marking is not colour alone. Each also gets an
`aria-label` suffix, "— choose to battle". The scoreboard status reads "Choose your battle". The
first-turn announcement is a transient banner over the board, with `pointer-events: none` and
`role="status"`, showing both star totals, who moves first, and "by coin flip" when it applies.

### 9. Pacing the opponent

The opponent's delay becomes `OPPONENT_THINK_MS + combats × CLASH_MS`. `CLASH_MS` mirrors
`--dur-clash` under the same mirrored-constant convention as `SCORE_STEP_MS`, so the opponent
doesn't place over the player's still-playing clash. The sequencer queues regardless, so a mismatch
only delays visuals and never corrupts them.

## Risks / Trade-offs

- [`animationend` never fires (element removed, animation interrupted, tab hidden)] → The sequencer
  also advances when the next event arrives, and on component destroy. Reduced motion bypasses
  waiting entirely.
- [Combo targets in the old owner's ring can include the placing player's own cards when the
  attacker loses, which may feel harsh] → It is exactly the stated rule ("in either direction").
  It is called out in the spec scenarios so it is a decision, not a surprise.
- [A long multi-combat opponent turn could run past the player's next move] → Allowed by design
  (motion never gates). The queue plays in order. `CLASH_MS` pacing makes it rare.
- [Existing service/component specs assert chain captures and "player moves first"] → Rewritten in
  the tasks. With the injectable RNG, the new specs are deterministic.
- [`randomReadyDeck` skipping rare cards biases the opponent toward commons] → It is intended:
  the opponent is held to the same rule as the player, and up to two rare cards remain possible.

## Migration Plan

There is no persisted data and no route changes. The change ships as one unit. Rollback is a code
revert.
