## 1. Rules and state

- [x] 1.1 In `src/model/game.ts`, declare `BOARD_SIZE = 5` and `HAND_SIZE = 9`, and reshape `GameState`: drop the two stored `score` fields, add `inspected: Card | null` and `lastPlaced: { row; col } | null`, and keep `board`, `hand`, `phase`, `selectedCardIndex`, `winner`, `lastFlipped`. Verify `ng build` reports the exact set of call sites that no longer compile, and that none of them lies outside `src/services/game.service.ts` and `src/components/game/`.
- [x] 1.2 Rewrite the deal in `game.service.ts` as a shuffle-and-refill helper that fills both hands to `HAND_SIZE` from `CARD_DB`, reshuffling when the shuffled pool runs out. Verify unit tests assert both hands hold 9 cards, that a deal succeeds from a 1-card database, and that with 15 cards no card appears more than twice across the whole deal.
- [x] 1.3 Replace stored scores with `scores = computed(...)` on `GameService`, counting cards owned in hand plus cards owned on the board. Verify unit tests assert 9/9 at deal, that the pair always sums to 18 after an arbitrary sequence of placements, and that a placement capturing nothing leaves both scores unchanged.
- [x] 1.4 Derive every board bound in `game.service.ts` from `BOARD_SIZE` — `resolveBattles`' edge check, the opponent's empty-cell scan, and the fullness check — and delete the `3`, `4`, and `10` literals. Verify a repo search for those literals in `game.service.ts` returns nothing, and that a unit test placing a card in each of the four corners resolves without a range error and captures nothing off-board.
- [x] 1.5 Replace the `placed >= 10` end condition with "both hands empty". Verify a unit test that plays a full match asserts the match is still in progress at 17 placed cards, ends at 18, and leaves exactly 7 cells empty.
- [x] 1.6 Add `inspect(card)` to `GameService`, setting `state.inspected` with no phase guard, and confirm `selectCard` keeps its `player-turn` guard. Verify unit tests assert `inspect` works during `opponent-turn` and `game-over`, and that it changes neither the board, the hands, the scores, nor `selectedCardIndex`.
- [x] 1.7 Set `lastPlaced` on every placement (player and opponent) and confirm `lastFlipped` is appended in capture order by the depth-first resolution. Verify a unit test on a hand-built board asserts the flipped coordinates come back in the order the chain captured them.
- [x] 1.8 Update the winner rule to "higher score wins, equal draws" reading from the derived scores, and confirm `exitGame()` discards the state so `gameActiveGuard` redirects. Verify existing `game-active.guard.spec.ts` still passes and a new test asserts a 9-9 finish is a draw.

## 2. Arena geometry

- [x] 2.1 Add a pure geometry function (unit + scale from a viewport width and height, per `design.md` decision 1) in its own file under `src/model/`. Verify unit tests cover: a 1920×1080 viewport yields scale exactly 1 and a unit above 120px; a 1366×768 viewport clamps the unit to 120px and yields a scale below 1; a very wide short viewport is height-bound and a narrow tall one is width-bound; and the unit is never below 120px at any viewport size including 320×240.
- [x] 2.2 Wire the function into `Game` with a `ResizeObserver` on the host feeding a signal, writing `--cw` and `--arena-scale` onto the inner `.arena` element (never the host). Verify by resizing the browser through the fitting threshold that the values update live and that no resize loop occurs (the observer fires once per resize, not repeatedly at rest).
- [x] 2.3 Apply `transform: scale(var(--arena-scale))` with `transform-origin: center` on `.arena` and `overflow: hidden` on the host, rounding the scale to two decimals and omitting the transform entirely when it is 1. Verify at 1920×1080 that no transform is applied, and at 1366×768 that the whole arena is visibly scaled with all four columns intact.

## 3. Four-column layout

- [x] 3.1 Rebuild `game.html` as four columns — codex, player hand, board, opponent hand — and delete the `.game-footer` element and the `.score-bar` header. Verify the rendered screen shows no footer band and no reserved space where one was.
- [x] 3.2 Replace the `--card-h` clamp chain in `game.css` with the `--cw` / `--ch` unit pair and express every column width, gap, and board padding as a multiple of it. Verify a repo search of `game.css` finds no remaining `clamp(` sizing chain and no hardcoded card pixel dimension.
- [x] 3.3 Confirm the arena never scrolls or clips: verify at 1920×1080, 1600×900, 1440×900, 1366×768, and a deliberately awkward 1100×620 that no scrollbar appears and that all four columns, all 18 hand positions, all 25 cells, the standing panel, and the inspector are fully inside the viewport.
- [x] 3.4 Verify continuous resize holds the fit: drag the window from wide to narrow and tall to short and confirm nothing clips or scrolls at any intermediate size.

## 4. Scoreboard

- [x] 4.1 Create `src/components/scoreboard/` rendering both players' names and scores plus the Retreat control, taking the scores and the active side as inputs and emitting a retreat event. Verify it renders 9 and 9 at the start of a match and both values update after a capture.
- [x] 4.2 Mark the active player with a non-colour cue alongside the colour (a pip, a rule, or a mark). Verify in a greyscale screenshot that the active side is still identifiable.
- [x] 4.3 Wire Retreat to `GameService.exitGame()` and navigation back to `/battle`. Verify retreating mid-match returns to Battle and that navigating directly to `/game` afterwards redirects to `/battle`.
- [x] 4.4 Add the score count-up stepper, snapping instead of stepping under `prefers-reduced-motion`. Verify a capture of three cards visibly counts rather than jumping, and that with reduced motion requested the new value appears immediately.

## 5. Card inspector

- [x] 5.1 Create `src/components/card-inspector/` rendering the inspected card through `app-card` at a width the geometry guarantees is ≥200px. Verify the inspected card shows its ability text, set, and number, and that it is visibly larger than any hand or board card.
- [x] 5.2 Give the inspector a resting state for "nothing inspected yet" that occupies the same box as a rendered card. Verify the other three columns sit in identical positions before and after the first inspection.
- [x] 5.3 Make hand cards and board cards inspectable: a hand card's activation calls both `selectCard` and `inspect`, a board card's calls `inspect` only. Verify that inspecting a board card while a hand card is selected leaves the hand selection intact and visibly selected.
- [x] 5.4 Verify a face-down opponent card reveals nothing: activating one renders nothing about it anywhere and leaves the inspector showing its previous card.
- [x] 5.5 Verify inspection is available out of turn and after the match: inspect a board card while the opponent is moving, and again once the result overlay is showing.
- [x] 5.6 Verify keyboard reach: tab to a hand card and to a board card, activate each with Enter and Space, and confirm the inspector updates both times.

## 6. Hand racks

- [x] 6.1 Create `src/components/hand-rack/` taking the nine hand slots and a `side` input, laying them out as 5 outer + 4 inner positions with the inner column offset by half a position, mirrored for the opponent. Verify both hands render nine positions in the same arrangement and that the rack's height matches the board's.
- [x] 6.2 Use the rack for both hands in `game.html` and delete the two divergent hand treatments (`.player-hand` grid and the absolutely positioned `.opponent-hand`) from `game.css`. Verify a repo search finds no remaining per-side hand layout rules.
- [x] 6.3 Render the opponent's rack face-down via `app-card`'s `faceDown` input. Verify no opponent card's name, art, stars, stats, chevrons, ability, or set appears in the DOM.
- [x] 6.4 Verify a played position stays in place: play three cards and confirm the remaining six have not moved and the three emptied positions still occupy their slots.

## 7. Board

- [x] 7.1 Expand the board to a 5×5 grid of `--cw` × `--ch` cells reading `BOARD_SIZE` rather than a hardcoded template. Verify 25 cells render and the board's outer dimensions are `5cw` by `5ch` plus gaps and padding.
- [x] 7.2 Keep empty cells as the lightweight rune element rather than an `app-card`, and confirm placement still targets them. Verify the DOM holds at most 19 `app-card` elements in the board area during a match, and that clicking an empty cell with a card selected places it.
- [x] 7.3 Retune the board's ornament and the `HOLLOW MASTER` watermark for the 5×5 footprint. Verify the watermark sits behind the cells at low emphasis and never overlaps a placed card's content.

## 8. Motion

- [x] 8.1 Declare one local `--stagger` and drive every delay as `calc(var(--index) * var(--stagger))`, taking durations and easings from the existing `--dur-*` / `--ease-*` tokens. Verify a repo search of `game.css` and the three new components' stylesheets finds no literal `ms`/`s` duration or inline cubic-bezier.
- [x] 8.2 Animate the deal: both hands' cards arrive into their positions staggered by slot index. Verify the cards arrive in sequence rather than at once, and that a card is selectable the moment it is visible mid-deal.
- [x] 8.3 Animate selection: the selected hand card rises out of the rack with a lit treatment distinguishable from the merely inspected card. Verify a selected card and a different inspected card are simultaneously distinguishable on screen.
- [x] 8.4 Animate placement travel: on placement, measure the source slot and destination cell, write `--fly-x` / `--fly-y` to the destination, and animate the landed card from that offset to zero. Verify the card is seen moving from hand to cell, and that the landed card is immediately interactive (inspectable) while the animation is still running.
- [x] 8.5 Animate captures in chain order using each flipped cell's index in `lastFlipped` as its delay index. Verify a placement that captures three cards in a chain turns them in capture order rather than simultaneously.
- [x] 8.6 Animate the inspector transition by keying the rendered node on the inspected card's identity so the enter animation restarts. Verify switching between two cards cross-fades and that neither the codex column nor the other three columns shift during the transition.
- [x] 8.7 Animate the turn hand-off in the scoreboard. Verify a visible state change occurs when the turn passes in each direction.
- [x] 8.8 Verify motion never gates interaction: select and place a card while deal animations are still playing, place the next card while capture animations from the previous placement are still running, and activate Retreat mid-animation — all three must be accepted.

## 9. Reduced motion and accessibility

- [x] 9.1 Add a `prefers-reduced-motion` block covering the deal, selection, travel, capture, inspector, hand-off, score, and ambient particles for this screen. Verify with the preference set that the screen renders finished immediately, every column and control is present and interactive, and no scrollbar appears.
- [x] 9.2 Verify state changes stay perceivable without motion: with reduced motion set, confirm a placement, a capture, and a turn hand-off are each still noticeable from the resulting static state.
- [x] 9.3 Verify the screen's accessible names and roles: the board cells, both hands, the scoreboard, the Retreat control, and the inspector each announce sensibly, and the opponent's face-down cards expose nothing about their cards.

## 10. Documentation

- [x] 10.1 Delete the provisional "in-game screen" bullet list from `CLAUDE.md` and point at `openspec/specs/game/screen/spec.md` and `openspec/specs/game/rules/spec.md` the way the card bullets already point at the card spec. Verify `CLAUDE.md` no longer states any in-game constraint of its own.
- [x] 10.2 Add the in-game screen's new pieces to the style guide if it enumerates components; otherwise confirm it needs no change. Verify the style guide still builds and renders.

## 11. Verification

- [x] 11.1 Run `ng test` and confirm the whole suite passes, including the new geometry, service, and inspector tests.
- [x] 11.2 Run `ng build` and confirm it succeeds with no new warnings.
- [x] 11.3 Play a full match end to end at 1920×1080: verify 9/9 at the start, scores summing to 18 throughout, 18 cards placed, 7 cells empty at the end, a correct result, and no clipping or scrollbar at any point.
- [x] 11.4 Repeat the full match at 1366×768 with the arena scaled, and confirm every column, hand position, and cell stays visible and interactive under the scale.
- [x] 11.5 Verify against `specs/design-system/card/spec.md`: every card on the screen is laid out at ≥120px, the inspector's card is laid out at ≥200px and shows its ability section, and the scaled arena has not changed any card's internal gate decisions.
