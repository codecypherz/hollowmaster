## Why

The in-game screen is the only surface in Hollow Master with no spec of its own. Its constraints
live as a provisional bullet list in `CLAUDE.md` — "fit on the screen", "take up as much space as
possible" — and the screen it produced shows the strain:

1. **The layout has nowhere to read a card.** Every card on the screen is sized by the same
   `--card-h` chain tuned to stack five cards in `100dvh`, which lands hand and board cards at
   168–220px tall — roughly 120–157px wide. The card renderer hides its ability section below
   200px wide (`design-system/card`), so **no card anywhere on the in-game screen ever shows its
   ability text, set, or number.** The player can see the art and the bars but cannot read the
   card they are about to play.
2. **The sizing chain has already run out of room.** `game.css` says so in its own comment: the
   `clamp()` floor is the card's 120px minimum expressed as a height, and "on short viewports this
   floor wins over the viewport term and the legacy layout no longer fits; refitting it belongs to
   the in-game rework." That rework is this change. Today the screen clips.
3. **A 4×4 board and five-card hands make a short, thin match.** The game ends at ten placed cards
   in sixteen cells, with hands laid out in an ad-hoc 3+2 grid on one side and an absolutely
   positioned overlapping stack on the other — two different hand treatments for the same thing.
4. **Scores read wrong.** A player's score is counted from board cells only, so it starts at a
   hardcoded `5`, drops to `1` the moment the first card is placed, and the two scores do not sum
   to anything meaningful until the board fills.

The screen also carries a footer that exists only to hold one button, spending vertical space the
board needs.

## What Changes

**Layout — a four-column arena.** The in-game screen becomes four columns across a landscape
viewport, with no footer:

- **Column 1 — the codex.** A scoreboard panel at the top carrying both players' names and scores
  and the player's Retreat control; below it, a large render of the *currently inspected card*.
- **Column 2 — Player 1's hand**, nine cards.
- **Column 3 — the board**, expanded from 4×4 to **5×5**.
- **Column 4 — Player 2's hand**, nine cards, face-down.

**A card inspector.** Clicking any card on the screen renders it large in column 1, at a width
above the card renderer's 200px ability gate, so the player can read its ability text, set, and
number. Inspecting is distinct from selecting a card to play: a hand card click does both, a board
card click only inspects. Face-down opponent cards reveal nothing when clicked — the card spec's
guarantee is not weakened for the inspector's convenience.

**Everything fits, always.** One card unit is derived from the viewport's height *and* width
budgets together, so the arena is sized by whichever binds. Where the viewport cannot host the
arena with cards at the renderer's 120px minimum, the arena is scaled uniformly as a single object
rather than re-laid-out, clipped, or scrolled. The screen never produces a scrollbar and never hides
a card, a hand, or a board cell.

**Rules — a longer match.** **BREAKING** for anything reading `GameState`:

- The board is 5×5. Every board dimension is read from one declared size rather than the `3`/`4`
  literals now scattered through `game.service.ts`.
- Each player is dealt **nine** cards. `CARD_DB` holds fifteen, so the deal draws **with
  duplicates allowed** — the same card may appear twice in a hand or in both hands.
- A player's score is the number of cards they **own** — in hand plus on the board — so it starts
  at 9 apiece and the two scores always sum to 18.
- The match ends when **both hands are empty**: eighteen cards in twenty-five cells, leaving seven
  cells empty. The `placed >= 10` end condition is removed.
- Combat resolution, capture chains, and the ±20% roll are unchanged in character, but their
  bounds checks derive from the board size instead of being hardcoded to `3`.

**Motion.** The screen gains a choreography rather than a set of independent effects: a staggered
deal into both hands, a lift-and-glow on selection, a card that travels from its hand slot to the
board cell it is played into, a capture pulse that propagates along a combo chain in order, a
cross-fade in the inspector, a turn hand-off, and score digits that tick. All of it keys off the
existing motion tokens and yields entirely to `prefers-reduced-motion`.

**Not in scope:** opponent AI strategy (it stays "a random legal cell"), multiplayer, card packs or
collection, the Battle/Shop/Cards screens, portrait or touch layouts beyond not breaking, and
adding cards to `CARD_DB`.

## Capabilities

### New Capabilities

- `game/screen`: The in-game screen's presentation — its four-column arena, the scoreboard and
  Retreat control, the card inspector, the absence of a footer, how the whole arena is fitted to
  the viewport without clipping or scrolling, and the motion that carries a turn. Nothing today
  specifies any of this; `navigation/routing` specifies only that the screen has a route and
  `navigation/shell` only that the nav yields to it.
- `game/rules`: The match itself — board dimensions, the deal, whose turn it is, how a placement
  resolves captures, how score is counted, and when and how a match ends. Today these rules exist
  only as literals inside `game.service.ts`.

### Modified Capabilities

- `design-system/card`: The card declares a 120px minimum supported width and forbids a surface
  from rendering a card below it. The in-game arena's fit behaviour scales the whole arena
  uniformly on viewports that cannot host it at that minimum, which needs the spec to say
  explicitly whether that is permitted. Adds one requirement distinguishing **laying a card out**
  below its minimum (still forbidden) from **uniformly scaling** an already-laid-out card as part
  of a whole surface (permitted, with the card's internal proportions and gates decided at its
  laid-out width). Without this the new fit requirement and the existing minimum-width requirement
  contradict each other.

## Impact

- **`src/model/game.ts`** — `GameState` overhaul: declared board size, a deck/deal representation
  that permits duplicates, the inspected card, and score as an owned-card count. Existing consumers
  of `GameState` break.
- **`src/services/game.service.ts`** — 5×5 board, nine-card deal with replacement, score from
  ownership, new end condition, board-size-derived bounds in `resolveBattles`, a new inspect
  action, `startGame`/`exitGame` unchanged in signature.
- **`src/components/game/game.{ts,html,css}`** — rewritten: four-column grid, scoreboard panel,
  inspector, two identical hand racks, 5×5 board, footer removed, the `--card-h` clamp chain
  replaced by a two-budget card unit, and the deal/place/capture/inspect choreography.
- **`src/components/card/card.css`** — no structural change expected; the inspector exercises the
  ≥200px path that no surface currently uses at this size, so the ability section's rendering at
  large widths gets its first real workload.
- **`src/app/game-active.guard.ts`, `src/app/app.routes.ts`, `src/components/nav-shell/`** —
  unchanged. The nav already yields the viewport on `/game`.
- **`CLAUDE.md`** — the provisional in-game bullet list is deleted; `game/screen` replaces it, as
  the card spec already replaced the card bullets.
- **Tests** — new coverage for the game service (deal size, duplicates permitted, score sums to 18,
  capture bounds at board edges, end condition, retreat) and for the screen's inspector behaviour.
- No dependency, routing, or build changes.
