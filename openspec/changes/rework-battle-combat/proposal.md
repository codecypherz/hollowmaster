## Why

Combat today is a thin stand-in: a placed card rolls ±20% against every opposing neighbour its
chevrons point at, captures chain without limit, the player always moves first, and the opponent's
hand is nine random cards that would fail the deck rules the player is held to. The game is meant
to play like Tetra Master — chevrons that meet are a fight, chevrons that meet nothing are a free
capture, a fight's loser drags its neighbours with it, and the player steers the order of a
multi-way clash. This change replaces the stand-in with that ruleset and gives the clash the
on-screen weight it deserves.

## What Changes

- **BREAKING (rules)** Only the card just played attacks. Each of its chevrons that points at an
  adjacent opposing card is either a **combat** (that card has a chevron pointing back) or a
  **defenseless capture** (it does not).
- **BREAKING (rules)** Combat is decided by a 1–100 roll per side against a band table (100 wins
  outright, 1 loses outright, 2–99 scale the base stat from −20% to +20%), with ties going to the
  defender. This replaces the uniform ±20% variance.
- Each card rolls at most once per turn. An attacker in several combats carries one attack power
  forward, reduced by each beaten defender's defense power. An attacker that rolls 100 wins every
  combat that turn unless a defender also rolls 100. A defender that rolls 1 takes nothing off the
  attacker's power.
- All combats resolve before any defenseless capture. When there are two or more combats, the
  player picks which one to fight next. The opponent picks its own order.
- **BREAKING (rules)** The open-ended capture chain is removed. The loser of a combat (attacker or
  defender) is taken, and every opposing card the loser's chevrons point at is taken with it, one
  step only. Defenseless captures and cards taken by a combo trigger nothing further.
- If the attacker loses a combat, the turn ends there. No further combats and no defenseless
  captures happen.
- **BREAKING (rules)** First turn is decided by star totals: the player whose deck holds fewer
  rarity stars goes second, and a tie is a coin flip. The player no longer always moves first.
- **BREAKING (rules)** The opponent's hand is a nine-card deck that satisfies the deck-building
  rules (the rarity limit), not an unconstrained draw from the card database.
- **Screen**: new motion for a card landing on the field and for combat. Combat shows both cards,
  both rolls, and both powers, then the outcome and the combo. The screen also gets a
  choose-your-next-combat interaction and an announcement of who moves first and why. All of it
  reads through the existing motion tokens and has a static form under reduced motion.

## Capabilities

### New Capabilities

_None._ Combat stays inside the match rules, which the project already treats as the single
authority for the game.

### Modified Capabilities

- `game/rules`: replaces the capture requirement with chevron-facing combat, defenseless captures,
  the roll table, diminishing attack power, single-step combos, and combat ordering. Turn order
  moves from "player first" to star totals. The opponent's deal now obeys the deck-building rule,
  and the database-size guarantee is restated for that.
- `game/screen`: placement and capture motion now include a landing flourish and a combat
  sequence. Adds a requirement for choosing the next combat and one for announcing the first turn,
  and extends reduced motion to cover combat.

## Impact

- `src/model/game.ts`: new state for the combat in progress, the resolution record, and first-turn
  facts. Phases gain a "choosing" state.
- `src/services/game.service.ts`: `resolveBattles` and `roll` replaced by a combat module. The
  opponent deal and first-turn logic change, and the opponent's turn may come first.
- New pure module (e.g. `src/model/combat.ts`) for the roll table, combat outcome, and turn
  resolution, so the rules are tested in Vitest without the service.
- `src/model/deck.ts`: the opponent's deck reuses `deckStanding` / `isBattleReady`.
- `src/components/game/*`, `src/components/card/*`, `src/components/scoreboard/*`: combat
  presentation, candidate highlighting and choice, landing animation, first-turn announcement.
- Tests: `game.service.spec.ts` and `game.spec.ts` assertions about chain captures and "player
  moves first" are rewritten. New Vitest for the combat module. The e2e reduced-motion and game
  specs extend to cover combat.
