## Context

- The Cards page (`collection`) and the Shop page (`shop`) each place four
  `.corner corner-{tl,tr,bl,br}` elements in their `.page-wrap` and set `--corner-size` and
  `--corner-inset` for them. The bracket styling itself is a global primitive. The battle screen
  and the style guide also use it, and they keep it.
- `shop.spec.ts` ("keeps the themed treatment of the page") currently asserts that `.corner`
  exists.
- In `collection-grid.css`, `.grid` uses `repeat(auto-fit, var(--tile-w))` with
  `justify-content: center`, and `.section-head` is a centred flex row with a 120px hairline in
  both `::before` and `::after`.
- The badge's `.badge-sep` is the `/` glyph, drawn in `--color-text-dim` (#6b7cae) at the badge's
  0.62rem size and regular weight, on a `--color-scrim` background. In the exhausted treatment it
  inherits `--color-void` on gold.
- The `@media (prefers-reduced-motion: reduce)` block in `collection-grid.css` contains a
  verbatim copy of the rarity-section and section-head rules, centring included. Only the
  `.tile { animation: none }` rule there is meant to differ.

## Goals / Non-Goals

**Goals:**

- Change only the two pages' own markup and styles, and the collection grid's styles.

**Non-Goals:**

- Changing the corner-frame primitive, or removing it from the battle screen or the style guide.
- Changing the card renderer, the deck bar, or the pinned region's layout. The deck bar's row
  stays centred, as its own requirement says.
- Re-centring the empty-collection message, which spans the whole row on purpose.

## Decisions

1. **Delete the corner markup instead of hiding it.** Remove the four elements and the
   `--corner-*` parameters from both pages, and update the comments that mention "corner frame".
   Hiding them with CSS would leave dead markup and the tokens that drive it. In the Shop's unit
   test, replace `.corner` in the list of required parts with an explicit assertion that there is
   no `.corner`.

2. **Left-align the grid with `justify-content: start` and keep `auto-fit`.** With start
   alignment, `auto-fill` and `auto-fit` look the same, so keep `auto-fit` and rewrite the
   comment that justified it in terms of centring. The grid's horizontal padding (16px) stays the
   shared left edge. The section heading's padding is already 16px, so the label and the first
   tile line up without any new measurements.

3. **Heading: drop the leading rule and let the trailing rule fill.** Remove `::before` and keep
   `::after` as a 1px `--color-section-border` rule with `flex: 1 1 auto`, so it runs from the
   label to the right edge. A rule on the left would push the label off the shared edge, and
   with no rule at all the label would no longer read as a divider.

4. **Separator: brighter colour, heavier weight, explicit spacing.** Set `.badge-sep` to
   `--color-text-bright` (#c4d6f5) and `font-weight: 700`, and keep its 0.25em margins. Use only
   existing tokens: the soul colour belongs to the used number, and gold belongs to the held
   number, so a neutral bright tone keeps the three parts distinct. In the exhausted treatment the
   separator already inherits `--color-void` on gold, which is high contrast; the 700 weight now
   applies there too. Alternatives considered: a drawn vertical bar (border-left) instead of the
   glyph, which would change the `2 / 3` reading the spec gives as its example; and only a larger
   font size, which would make the badge taller and risk overlapping the chevrons.

5. **Remove the duplicated block inside reduced motion.** Leave only `.tile { animation: none; }`
   inside `@media (prefers-reduced-motion: reduce)`. Otherwise the copied centring would come back
   for reduced-motion users, which breaks the new "Alignment holds under reduced motion"
   scenario.

## Risks / Trade-offs

- [A narrow collection now leaves empty space on the right, which can look unbalanced on a wide
  viewport] → This is what the user asked for. The deck region above stays centred, and the
  rarity headings' trailing rules span the width, which gives the region a frame.
- [Existing e2e screenshots change] → Screenshots are review artifacts, not baselines, so nothing
  fails. Look at `cards-rarity-sections.png` again when reviewing.
- [A heavier `/` could crowd the numbers at 0.62rem] → Check at the 150px tile width in the
  Playwright screenshot. The badge's existing "obscures nothing" check guards against overlap.
