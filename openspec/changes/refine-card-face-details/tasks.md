## 1. Set rename

- [x] 1.1 Change the shared set constant in `src/model/card.ts` from `'Forgotten Crossroads'` to `'FC'` and rename the constant to match; verify `ng test` passes after updating the fixture set value in `src/components/card/card.spec.ts`, and that the card face's plate renders `FC` in the style guide.

## 2. Stat bars: label and fill both readable

- [x] 2.1 Restructure `.stat-bar` in `card.html` / `card.css` into a fixed label cap plus a track that takes the remaining width, with the fill a percentage of the track; verify by rendering a card with attack 3 and confirming the fill is visible in full and uncovered by the `AT` cap.
- [x] 2.2 Style the cap so it reads as part of the same delineated row (its own ground, shared row bounds) and keep the `DE` fill's colour distinct from `AT`; verify both bars at 120px and at 300px look like single rows rather than two detached pieces.
- [x] 2.3 Confirm legibility at the extremes: verify a card at attack 100 keeps `AT` legible against a full fill, and that two cards at attack 3 and attack 12 show discernibly different fill at exactly 120px wide.
- [x] 2.4 Update the ornament-degradation block at `max-width: 160px` so the cap and track survive it as content while only their ornament simplifies; verify the labels and both fills are present and readable at 120px, 140px, and 160px.
- [x] 2.5 Update `card.spec.ts` for the new structure — the `AT` / `DE` assertions and any assumption that the label sits inside the fill's box — and add a case asserting the fill is not covered at a low value; verify `ng test` passes.

## 3. Ability section box

- [x] 3.1 Give `.cf-ability` a border on all four sides inside the `@container card (min-width: 200px)` block, inset from the face edges so each side reads as the section's own border, absorbing the inset into its existing padding; verify at 200px, 260px, and 400px that all four sides are visible and the text keeps its room.
- [x] 3.2 Verify the box does not appear below the gate: at 199px the section is still visually hidden with no stray border, and its text is still reachable via `aria-describedby` (existing test coverage should stay green).
- [x] 3.3 Add a `card.spec.ts` assertion that the ability section carries a border on all sides when the gate is open; verify `ng test` passes.

## 4. Name fitting

- [x] 4.1 Add a computed name-fit factor to `CardComponent` derived from the name's length via an ordered `maxChars → factor` table, exposed to the template as a CSS custom property; verify unit tests cover a short name (factor 1), a mid-length name, and a very long name (smallest factor).
- [x] 4.2 Rewrite `.cf-name`'s `font-size` so the fit factor multiplies all three terms of its `clamp()`, and recalibrate the base term downward so the longest name currently in `CARD_DB` fits one line at the default tier; verify `Aspid Hatchling` renders on one line, unellipsised, at 200px and at 400px.
- [x] 4.3 Remove `white-space: nowrap` and `text-overflow: ellipsis` from `.cf-name-text` and allow wrapping within the fixed-height name row; verify a synthetic 40-character name wraps to two lines with every character visible and no clipping.
- [x] 4.4 Verify the name row's height and the positions of the image, stats, and ability sections are identical between a 4-character and a 40-character name rendered at the same width.
- [x] 4.5 Verify fitting at the extremes of the size range: a long name at exactly 120px stays inside the name section and legible, and at a large size it is not blown up past the section.
- [x] 4.6 Replace the truncation assertion in `card.spec.ts` with assertions that no ellipsis or clipped text occurs at any name length; verify `ng test` passes.

## 5. Rarity off the frame, ownership on it

- [x] 5.1 Search the repo for `data-rarity` and confirm `card.css` and `card.spec.ts` are its only consumers; then remove the `[attr.data-rarity]` host binding from `CardComponent`.
- [x] 5.2 Delete the six `:host([data-rarity='N'])` blocks, the `--frame-sheen` / `--frame-sheen-opacity` variables, the `.frame::before` sheen element, the `raritySheen` keyframes, and the reduced-motion rule that stops the sheen; verify cards of every star rating render with identical frames in the style guide.
- [x] 5.3 Confirm `--frame-metal`, `--frame-rim`, and `--frame-aura` keep neutral defaults and that the face's inset hairline and the image window's ring still render; verify the frame still reads as layered (border, interior, image window) at 200px and at 400px.
- [x] 5.4 Set `--frame-metal` under `:host(.owner-player)` and `:host(.owner-opponent)` so the border itself reads as the owner's, keeping the existing aura and the non-colour owner pip; verify player, opponent, and unowned cards are distinguishable from one another in the style guide's state section.
- [x] 5.5 Remove the `--color-rarity-*` tokens from `src/styles/tokens.css`; verify no stylesheet still references them and the style guide's token list renders without them.
- [x] 5.6 Remove the rarity-attribute assertions from `card.spec.ts` and add one asserting cards of different star ratings render identical frame treatment; verify `ng test` passes.

## 6. Style guide

- [x] 6.1 Replace the "Rarity frames" section with a star-track comparison (same per-rating samples, copy rewritten to say the frame no longer varies) and update the card-section copy that describes the frame's rarity metal; verify the page no longer claims a per-rarity frame treatment.
- [x] 6.2 Add stat-bar examples at low, middling, and high values, and name examples with a short name and a deliberately long one; verify both label/fill legibility and name fitting can be judged from the page without running the game.
- [x] 6.3 Update the card-section constraint copy to mention the bordered ability section; verify it matches what the page actually renders.

## 7. Verification

- [x] 7.1 Run `ng test` and confirm the whole suite passes.
- [x] 7.2 Run `ng build` and confirm it succeeds with no unused-token or unused-binding warnings introduced by the change.
- [x] 7.3 Walk the style guide at the size ladder's every rung (120px through the largest) and confirm no clipping, no truncated name, both stat labels and fills readable, the ability box bordered above the gate, and identical frames across ratings.
- [x] 7.4 Open the in-game screen and confirm player and opponent cards read as blue and red from the border alone, board tiles included, with nothing clipped.
