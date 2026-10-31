## 1. Remove the corner frame from the Cards and Shop pages

- [ ] 1.1 Delete the four `.corner` elements and their comment from
  `src/components/collection/collection.html`. Remove `--corner-size` and `--corner-inset` from
  `.page-wrap` in `collection.css`, and change the header and `:host` comments so they no longer
  mention a corner frame. Verify that `grep -n corner src/components/collection/` returns nothing.
- [ ] 1.2 Do the same in `src/components/shop/shop.html` and `shop.css`, keeping the
  `.ornament` dividers. Verify that `grep -n corner src/components/shop/shop.html
  src/components/shop/shop.css` returns nothing.
- [ ] 1.3 In `src/components/shop/shop.spec.ts`, take `.corner` out of the "keeps the themed
  treatment of the page" part list, and add an assertion that the page has no `.corner`. Add a
  matching unit check in the collection component spec that the Cards page renders the void,
  mist, and particles but no `.corner`. Verify with `ng test`.

## 2. Left-align the collection

- [ ] 2.1 In `src/components/collection-grid/collection-grid.css`, set `.grid` to
  `justify-content: start` and rewrite the `auto-fit` comment so it no longer talks about
  centring. Verify by checking in a scratch Playwright run that a short row starts at the region's
  left padding.
- [ ] 2.2 Change `.section-head` to `justify-content: flex-start`, delete the `::before` rule,
  and make `::after` `flex: 1 1 auto`, so a single rule runs right from the label. Update the
  hairline comment to match. Verify that the label's left edge equals the first tile's left edge
  in the same scratch run.
- [ ] 2.3 Remove the duplicated rarity-section and section-head rules from the
  `@media (prefers-reduced-motion: reduce)` block, leaving only `.tile { animation: none; }`.
  Verify by reading the block, and with the reduced-motion e2e check in 4.2.

## 3. Make the badge separator legible

- [ ] 3.1 Style `.badge .badge-sep` with `color: var(--color-text-bright)` and
  `font-weight: 700`, keeping its 0.25em margins, so it is at least as heavy and as high in
  contrast as the used number. Leave the exhausted treatment inheriting `--color-void`. Verify in
  the Playwright screenshot of a normal badge and an exhausted badge at the 150px tile width, and
  confirm that the existing "badge obscures nothing" e2e check still passes.

## 4. Browser verification

- [ ] 4.1 In `e2e/cards.spec.ts`, add a test showing that, in the rarity order, each
  `.section-head` label's left edge and its section's first tile's left edge match the collection
  region's left padding (within 1px), with no rule drawn to the left of the label. Also check that
  under Name the first tile keeps that left edge. Run `npm run e2e -- cards`.
- [ ] 4.2 In `e2e/reduced-motion.spec.ts` (or the same cards test with `reducedMotion: 'reduce'`),
  assert that the same left alignment holds under reduced motion. Run the affected spec.
- [ ] 4.3 Add a Cards-page check that the computed style of `.badge-sep` has a font weight of at
  least that of `.used` and the colour `--color-text-bright`, in both the normal and the exhausted
  treatment. Run `npm run e2e -- cards`.
- [ ] 4.4 Add checks in `e2e/cards.spec.ts` and `e2e/shop.spec.ts` (storefront and mid-opening)
  that `.corner` has a count of 0 while `.void-bg` and `.particles` are still present. Run
  `npm run e2e -- cards shop`.
- [ ] 4.5 Run the full `ng test` and `npm run e2e`, and review `test-results/cards-rarity-sections.png`
  and the shop screenshots to confirm that the corners are gone, the sections are left aligned,
  and the badge `/` is easy to see.
