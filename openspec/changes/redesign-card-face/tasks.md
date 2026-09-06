## 1. Constraints and tokens

- [ ] 1.1 In `CLAUDE.md`, delete the `### Card Look and Feel` and `### Board Look and Feel` blocks and replace them with a pointer naming `openspec/specs/design-system/card/spec.md` as the authority for card and board-tile rendering. Keep the in-game bullets under `## Look and Feel requirements`, marked as provisional pending the in-game rework's own spec, so they are not lost. Verify by grepping `CLAUDE.md` for "3 sections" and "progress bar" and finding nothing — no UI constraint is stated in two places.
- [ ] 1.2 Add the new semantic colour tokens to `@theme static` in `src/styles/tokens.css` (ability panel/text/rule, star lit/empty/socket/six/six-glow, stat label + label background + gradations, plate background/text, and `--color-rarity-1` … `--color-rarity-6` plus `--color-rarity-6-shimmer`). Verify by loading the style guide route and confirming every new token appears as a labelled swatch without any hand-written entry.

## 2. Card component surface

- [ ] 2.1 In `src/components/card/card.ts`, replace the `stars()` string computed with `starSlots()` (five booleans, first N true) and `showSixth()` (`stars === 6`). Verify `ng test` fails only on the old star assertions, which task 5.2 restates.
- [ ] 2.2 Add `setNumber()` (the card's number zero-padded to three) and a per-instance `abilityId` from a module-level counter. Verify two `app-card` instances rendered together produce different `abilityId` values.
- [ ] 2.3 Bind `[attr.data-rarity]` on the host to `card()?.stars ?? null`, and extend `description()` to include the set and the number. Verify the host carries `data-rarity="3"` for a 3-star card and the `aria-label` contains the set name and number.

## 3. Card markup

- [ ] 3.1 Restructure `card.html` so `.face` holds four sections in order — `.cf-name`, `.cf-img`, `.cf-stats`, `.cf-ability` — with the ability section always present in the DOM. Verify a rendered card's `.face` has exactly four element children in that order.
- [ ] 3.2 Replace the star string with the plaque markup: five `.star` spans driven by `starSlots()` carrying a `.lit` class, plus a `.star-six` span rendered under `@if (showSixth())` and placed outside the plaque element. Verify a 3-star card renders five `.star` elements with three `.lit` and no `.star-six`, and a 6-star card renders five `.lit` plus one `.star-six`.
- [ ] 3.3 Rebuild the stat rows: drop both `<img class="stat-icon">` elements, and give each bar a `.stat-label` capsule containing the literal text `AT` and `DE` inside the bar element alongside the track and fill. Verify no `img` remains under `.cf-stats` and the `AT` / `DE` text nodes are descendants of their own `.stat-bar`.
- [ ] 3.4 Build the ability section as a two-row grid: the ability text carrying `[id]="abilityId"`, and an identity strip holding the set name and padded number. Wire `aria-describedby` to `abilityId` on both the `button` and the `span` frame variants. Verify the frame's `aria-describedby` resolves to an element containing the card's ability text.
- [ ] 3.5 Confirm the face-down branch still renders none of the new content. Verify a face-down card exposes no `.cf-ability`, `.cf-stars`, `.star`, set name, or number anywhere in its DOM or text content.

## 4. Card styling

- [ ] 4.1 Set `container: card / inline-size` on `:host` and add the `@container card (min-width: 200px)` block that switches `.face` to four rows and restores `.cf-ability` from the visually-hidden treatment to `position: static`. Verify on the style guide's size ladder that the ability section is absent at 72/110/150px and present at 200/260px, and that the card's aspect ratio is unchanged on both sides.
- [ ] 4.2 Style the frame: gradient border via paired `padding-box` / `border-box` backgrounds reading `--frame-metal`, bevel inset shadows, a recessed `.face` interior, and the `.frame::before` sheen layer positioned `absolute; inset: 0` so it does not become a grid item. Verify the card reads as three distinct depths and that adding the sheen layer shifts nothing in the 3×3 chevron layout.
- [ ] 4.3 Add the six `:host([data-rarity='N'])` blocks setting `--frame-metal`, `--frame-rim`, `--frame-aura`, and `--frame-sheen` per the tier table in `design.md` — Decision 4. Verify the style guide's rarity row shows six distinguishable frames at the same size, with the 6-star the most distinct.
- [ ] 4.4 Style the art window: inset ring, `::after` bottom-weighted vignette and top gloss, with `.cf-stars` raised above the overlay. Verify the stars stay fully legible over both a bright and a dark card artwork, and that the window still reads as inset when the image fails to load.
- [ ] 4.5 Style the star plaque and slots: inset plaque with a hairline rim, `clip-path` star polygons, gold gradient plus glow for `.lit`, dark socket treatment for unlit. Verify at 132px that lit and unlit slots are distinguishable at a glance.
- [ ] 4.6 Style `.star-six` as the void-touched star sitting outside the plaque and overlapping its right edge, larger than the five, with a radiating glow. Verify a 6-star card beside a 5-star card reads as beyond the scale rather than as one more star.
- [ ] 4.7 Style the stat bars: inset track with faint quarter gradations, gradient fill with a specular top edge, and the `AT` / `DE` capsule pinned inside the bar's left edge on its own background. Verify the label is legible on a 5-attack card (label over empty track) and on a 95-attack card (label over fill).
- [ ] 4.8 Style the ability panel: `--font-flavor` text on an inset panel below a hairline rule, `overflow: hidden` with a bottom `mask-image` fade, and the identity strip right-aligned in its own row. Verify the longest ability in `CARD_DB` fades rather than clipping hard at 200px and at 260px, and that no text runs under the set/number strip.
- [ ] 4.9 Add the ornament reductions that take effect as the card approaches its 120px minimum — drop bar gradations, specular highlights, plaque rim detail, and frame filigree below the sizes where they resolve — keeping every section, star slot, stat bar, label, and chevron present. Verify at exactly 120px that nothing is clipped, that the name, five star slots, both `AT`/`DE` labels, and all eight chevrons are legible, and that the card looks composed rather than crowded.
- [ ] 4.10 Extend the `prefers-reduced-motion` block to cover the rarity sheen and the sixth star's glow animation. Verify with the OS reduced-motion setting on that no card animates while selection and rarity remain visually identifiable.

## 5. Tests

- [ ] 5.1 Restate the section test in `card.spec.ts` from three sections to four in order (`cf-name`, `cf-img`, `cf-stats`, `cf-ability`). Verify `ng test` passes it.
- [ ] 5.2 Replace the star assertions: five `.star` slots always present, `.lit` count equals the rating for ratings 1 through 6, `.star-six` absent for 1–5 and present only at 6. Verify `ng test` covers each rating.
- [ ] 5.3 Narrow the numeral test — strip `.sr-only` and the set/number strip, then assert no numeral remains — and add a companion test asserting the padded collector number *is* rendered. Verify both pass and that the pair still forbids any attack, defense, or rating numeral.
- [ ] 5.4 Add tests for the `AT` and `DE` labels being inside their own bars, for `.cf-ability` being present in the DOM with `aria-describedby` resolving to it, and for the face-down card exposing no ability, set, or number. Verify `ng test` passes.
- [ ] 5.5 Run the full suite and Prettier. Verify `ng test` is green and `npx prettier --check src` reports no issues.

## 6. Surfaces

- [ ] 6.1 Delete `src/components/open-pack/` (`open-pack.ts`, `.html`, `.css`). Drop its line from the architecture tree in `CLAUDE.md` at the same time. Verify `grep -rn "open-pack\|OpenPack" src CLAUDE.md` returns nothing, `ng build` succeeds, and every route in `app.routes.ts` still resolves.
- [ ] 6.2 Extend the style guide's card section: a size ladder floored at the 120px minimum that straddles 200px with the gate visible on both sides, all six star ratings at a legible size, and the six rarity frames side by side at one size — synthesising sample cards for any rating `CARD_DB` lacks rather than skipping it. Verify every scenario in `specs/design-system/style-guide/spec.md` is directly observable on the page, and that no example on the page renders a card below 120px.
- [ ] 6.3 Update the style guide's card-section description text, which currently says "three sections". Verify it matches the four-section contract.

## 7. Game screen floor and final verification

- [ ] 7.1 Raise `--card-h`'s lower clamp bound in `src/components/game/game.css` so `--card-w` can never fall below 120px (a floor of `168px`, since `--card-w` is `--card-h / 1.4`). Change nothing else on the screen. Verify with devtools that `--card-w` computes to at least 120px at 1920×1080, 1366×768, and 1280×600.
- [ ] 7.2 Record, do not fix, where the legacy game layout no longer fits at the new floor: check each of those three viewports for a clipped board, clipped hands, or overlap, and write the findings into the change as a short note for the in-game rework. Verify the note names each viewport and what fails there, and that no game layout rule other than 7.1's floor was touched.
- [ ] 7.3 Review the finished card against the reference sketch and against `specs/design-system/card/spec.md`: four sections in the drawn order, chevrons inside the border and outside every section, star plaque top-left of the image, `AT`/`DE` inside the bars, ability panel with the set/number in its bottom-right. Verify each item on the style guide at 260px.
- [ ] 7.4 Walk every requirement in `specs/design-system/card/spec.md` against the built card and confirm each scenario holds. Verify the walk covers the requirements the unit tests cannot reach — the 200px gate, the frame craft, the rarity tiers, the minimum-width legibility, and the ornament degradation.
