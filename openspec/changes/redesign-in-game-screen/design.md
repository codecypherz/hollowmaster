## Context

See `proposal.md — Why` for motivation, and `specs/game/screen/spec.md` and
`specs/game/rules/spec.md` for the requirements this design serves.

The constraints that actually shape the approach:

- **`design-system/card` owns the card.** Every card is an `app-card`; no surface may reimplement
  the face. The ability section appears only at **≥200px** rendered width, and the card declares a
  hard **120px** minimum laid-out width that a surface may not go below. Those two numbers drive the
  whole geometry: the inspector must clear 200px, and every other card must clear 120px.
- **The current sizing chain is a single `clamp()` in `game.css`** whose own comment records that it
  no longer fits. Its floor is the 120px minimum expressed as a height (`168px`), and on short
  viewports the floor wins and the layout overflows.
- **State is one signal.** `GameService` holds `GameState | null`; `game-active.guard` reads
  `isActive()`. `Game` is the only consumer of the state's shape, so a `GameState` overhaul has a
  one-component blast radius.
- **`CARD_DB` holds 15 cards** — fewer than the 18 two nine-card hands need.
- **No animation library.** No `@angular/animations` in `package.json`; motion is CSS keyframes and
  tokens (`--dur-*`, `--ease-*`) from `src/styles/tokens.css`, with
  `prefers-reduced-motion` handled in `src/styles/primitives.css`.

## Goals / Non-Goals

**Goals:**

- One geometry rule that provably fits the arena into any landscape viewport, expressed so it can be
  unit-tested rather than eyeballed.
- The card renderer's 200px ability gate is exercised — the inspector is the reason the gate exists.
- Rules that read from one declared board size, so 5×5 is a value and not a rewrite.
- Score that cannot drift out of sync with the board, by never storing it.
- Motion built from one stagger token and one pace token, so the whole choreography is tunable from
  two values.

**Non-Goals:**

- Portrait, phone, or touch-first layouts. The screen targets landscape; it must not *break* in
  portrait (it scales), but portrait is not designed for.
- Opponent intelligence. The AI stays "first card in hand, random empty cell", generalised to 5×5.
- Any change to the card face itself, to `CARD_DB`, or to the Battle/Shop/Cards screens.
- Persisting or resuming a match.

## Decisions

### 1. Geometry is one card unit, computed in TypeScript, not a CSS `clamp()`

Everything on the screen is a multiple of one length, `--cw` (a card's laid-out width), with
`--ch = 1.4 × --cw` from the 2.5:3.5 ratio. In `--cw` units the arena is:

| Column | Width | Height |
| --- | --- | --- |
| Codex | `2cw + g` | standing panel + `2.8cw + 1.4g` |
| Hand rack ×2 | `2cw + g` each | `7cw + 4g` |
| Board | `5cw + 4g + 2p` | `7cw + 4g + 2p` |

Totals: **`W ≈ 11cw`**, **`H ≈ 7cw`** plus gaps — a natural arena aspect of about **1.6 : 1**, which
sits inside 16:9 with room and makes height the binding dimension on most laptops.

The fit is then two stages:

```
ideal  = min( (viewportH - chromeV) / 7 , (viewportW - chromeH) / 11 )
unit   = max( 120px, ideal )        // never lay a card out below the card's minimum
scale  = ideal / unit               // 1 when the viewport can host it, < 1 when it cannot
```

`unit` becomes `--cw`; `scale` becomes `--arena-scale`, applied as `transform: scale()` on the arena
as a whole.

**Why TypeScript and not CSS.** Stage two is a ratio of two lengths, and CSS `calc()` cannot divide
a length by a length. A pure-CSS chain can express `unit` but not `scale`, which is exactly the
half that the current `clamp()` is missing and why it overflows today. Computing both in one
function also makes the geometry testable: given a viewport, assert the unit and the scale — a
guarantee a `clamp()` string can never carry. A `ResizeObserver` on the host feeds a signal; the
host is sized by the viewport and the custom properties are written to the inner `.arena` element,
so the observation cannot feed back into itself.

*Alternatives considered.* **Pure CSS `clamp()`** — what exists now; cannot express the scale stage,
so it clips. **CSS `zoom`** — would re-lay-out at the zoomed size, so the card's container queries
would resolve against the *scaled* width and the ability gate would flip on its own; that
contradicts the `design-system/card` delta this change makes. **An SVG `viewBox` wrapper** — scales
cleanly but breaks HTML layout, focus, and text selection inside it.

### 2. The whole arena scales; individual cards never do

When the viewport is too small, one `transform: scale(var(--arena-scale))` is applied to the arena
container, `transform-origin: center`, with the outer wrapper `overflow: hidden`. Cards inside are
still laid out at `--cw ≥ 120px`, so every width-gated decision the card makes — the ability gate,
the ornament level, the name fitting — is made at a width where its own guarantees hold. The scale
is a viewing transform, equivalent to browser zoom.

This is the reason `specs/design-system/card/spec.md` is modified rather than merely consumed: the
existing requirement said a surface must not *render* a card below 120px, which a uniform scale
technically does. The delta separates **laid-out width** (still floored at 120px) from a
**uniform region scale** (permitted), and forbids the abuse — scaling one card alone to squeeze it
into a slot. Without that delta, this design and the card spec contradict each other.

### 3. Score is derived, never stored

`GameState` drops the two `score` fields. `GameService` exposes
`scores = computed(() => countOwned(state()))`, counting cards in hand **plus** cards owned on the
board. This makes `player + opponent === 18` a structural fact rather than a thing to maintain, and
deletes the class of bug the current code has (a hardcoded `5` at deal time, then a board-only count
that drops to `1` on the first placement).

*Alternative considered:* keep stored scores and fix the arithmetic — rejected; the arithmetic is
recomputed from the board on every placement anyway, so storing it only creates a second source of
truth.

### 4. Board size is one constant, and the state carries the whole board

`BOARD_SIZE = 5` and `HAND_SIZE = 9` live in `src/model/game.ts`. `resolveBattles`' bounds check
(`nr < 0 || nr > 3`) becomes a bounds function over `BOARD_SIZE`; the opponent's empty-cell scan and
the fullness check follow. No `3`, `4`, `5`, or `10` literal survives in `game.service.ts`.

### 5. The deal shuffles and refills rather than sampling independently

18 cards from a 15-card database means duplicates (the user's decision — see `proposal.md`). Rather
than 18 independent random picks, which can plausibly deal the same card four times, the deal
shuffles `CARD_DB`, takes cards in order, and reshuffles when it runs out. With 15 cards and 18
needed, this guarantees at most two copies of any card in a match and a maximally varied spread,
while still satisfying the spec's "the deal succeeds for any database holding at least one card".

### 6. The hand rack is nine positions as 5 + 4, offset — one component, used twice

Nine cards do not make a rectangle. The rack is two sub-columns: five positions in the outer column
and four in the inner column, the inner offset by half a position so the two interleave. That spans
`5ch + 4g` — exactly the board's height — in `2cw + g` of width, and reads as a fanned quiver rather
than a grid with a hole in it.

One `HandRack` component takes `side: 'player' | 'opponent'` and renders mirrored. Using the same
component for both hands is what makes the spec's "both hands are presented alike" true by
construction instead of by discipline — today the two hands are a CSS grid and an absolutely
positioned overlap stack, which is how they drifted apart.

### 7. Placement travel is a FLIP offset on the destination, not a flying ghost

On placement, the component measures the source hand slot and the destination cell with
`getBoundingClientRect()`, writes the delta to the destination cell as `--fly-x` / `--fly-y`, and
the cell's card animates from that offset to zero. No ghost element is created, nothing is appended
to the body, and the card that lands is the real one — so it is immediately interactive, which the
spec requires ("motion never gates interaction").

Capture order comes free: `lastFlipped` is already appended in capture order by the depth-first
resolution, so each flipped cell binds its index as `--flip-index` and delays by
`index × --stagger`. `lastPlaced` is added to `GameState` to give the travel its target and the
landing its pulse.

### 8. Three new presentational components, state stays in the service

`src/components/` is flat, so: `scoreboard/`, `card-inspector/`, `hand-rack/`. `Game` keeps the
board, the overlay, and the geometry signal. Splitting is not decoration — `hand-rack` is what
guarantees decision 6, and `card-inspector` isolates the one place on the screen where a card is
rendered above 200px, which is the behaviour most worth testing on its own.

### 9. Inspection is a separate state from selection

`GameState` gains `inspected: Card | null`, set by `inspect(card)`. `selectedCardIndex` is
unchanged in meaning. A hand card's activation calls both `selectCard(i)` and `inspect(card)`; a
board card's calls only `inspect(card)`. A face-down card is not activatable at all — `app-card`
already renders the back with `aria-hidden` and no button, so "inspecting reveals nothing" is
enforced by the card renderer rather than by a check in the game.

Inspecting must work while it is the opponent's turn and after the match ends, so `inspect()`
deliberately does **not** guard on phase — unlike `selectCard`, which does.

The inspector cross-fade needs the DOM node to be recreated when the card changes, which
`@if (inspected(); as c)` will not do. The template iterates a single-element list keyed on the
inspected card's identity, so a change destroys and recreates the node and the CSS enter animation
restarts.

### 10. Motion is two tokens plus per-element indices

Every animation on the screen derives from `--dur-*`/`--ease-*` in `tokens.css` and one local
`--stagger`. Per-element delay is always `calc(var(--index) * var(--stagger))` with `--index` bound
from the template. Retuning the choreography is then two values, which is the same rule the Battle
screen already follows.

The score count-up is the one piece that cannot be pure CSS: a small stepper in `Scoreboard` walks a
displayed value toward the real one. Deltas are 0–4, so a fixed per-step interval is enough; under
`prefers-reduced-motion` it snaps.

## Risks / Trade-offs

- **Fractional `transform: scale` softens text.** → The scale is only applied below the fitting
  threshold, and `--arena-scale` is rounded to two decimals so the same viewport always produces the
  same rasterisation. Above the threshold the scale is exactly `1` and the property is not applied
  at all.
- **`ResizeObserver` feedback loop.** → The observer watches the host, which is sized by the
  viewport; the computed custom properties are written to the inner `.arena`, whose size cannot
  influence the host (`overflow: hidden`, arena absolutely centred). No write can re-trigger the
  read.
- **The inspector renders a card at ~250–300px, a width no surface currently uses.** The ability
  section, name fitting, and ornament have only ever been exercised small. → Verify against the
  style guide, which already renders cards at multiple widths, and treat any defect found as a card
  fix, not an inspector workaround.
- **Roughly 45 card-shaped elements on screen** (18 hand + up to 25 board + inspector), each with
  container queries and layered frame CSS. → Empty board cells render a lightweight rune element,
  not an `app-card`; the particle count for this screen is reduced; no `backdrop-filter` outside the
  end-of-match overlay.
- **Duplicates are visible.** With 15 cards dealt into 18 slots, a player will routinely see the
  same card twice. → Accepted deliberately (`proposal.md`); growing `CARD_DB` is the real fix and is
  a separate change.
- **Small viewports get a small arena.** At 1366×768 the fit lands near `scale ≈ 0.85`, so cards
  render around 102px visually. Below roughly 1100×620 the arena is legible but cramped. → The
  inspector is the mitigation: the card the player is actually reading is always the largest thing
  on the screen, and it is the only one that needs to be read.
- **`GameState` is a breaking shape change.** → Nothing persists it and `Game` is its only consumer;
  the compiler finds every site.

## Migration Plan

No data migration: `GameState` lives only in memory and is discarded on retreat or navigation.
Deployment is a normal build. Rollback is reverting the change — the route, the guard, and the
service's public entry points (`startGame`, `exitGame`, `isActive`) keep their signatures, so
nothing outside `src/components/game/` and `src/model/game.ts` depends on the new shape.

`CLAUDE.md`'s provisional in-game bullet list is deleted in the same change that lands
`specs/game/screen/spec.md`, so there is never a window where two documents claim authority over
this screen.
