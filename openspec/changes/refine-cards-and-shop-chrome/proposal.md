## Why

Three small visual problems on the Cards and Shop pages. The corner-bracket frame adds clutter to
two pages that already have a lot going on. On the Cards page, the `/` between the used and held
counts in a tile's badge is drawn in the dim text colour at regular weight, so the line nearly
vanishes against the scrim. And the rarity sections, with their headings and tiles, are centred,
which makes the groups harder to scan than a left edge that every section shares.

## What Changes

- Remove the four corner-frame brackets from the Cards page and the Shop page. The corner-frame
  primitive stays in the design system; the battle screen and the style guide still use it.
- Make the separator between the used and held counts in the collection badge clearly visible:
  brighter and heavier, so it reads as a divider at the badge's small size. That includes the
  exhausted (inverted) badge.
- Left-align the collection on the Cards page. A rarity section's heading starts at the left
  edge, with its rule running right from the label rather than flanking it on both sides. Tiles
  pack from the left edge in every order, both inside rarity sections and in the single run used
  by the other orders, so changing the order doesn't move the grid sideways.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `collection`: the rarity sectioning requirement gains left alignment for headings and tiles,
  the count-badge requirement gains a legible separator, and a new requirement says the page draws
  no corner frame.
- `shop`: a new requirement says the Shop page draws no corner frame.

## Impact

- `src/components/collection/collection.html`, `collection.css`: drop the corner markup and the
  `--corner-*` parameters, and update the comments that mention the frame.
- `src/components/shop/shop.html`, `shop.css`: the same.
- `src/components/shop/shop.spec.ts`: the themed-treatment test currently expects `.corner`, so
  it must assert that there is none.
- `src/components/collection-grid/collection-grid.css`: grid alignment, section-head layout, and
  the badge separator style. This also removes a stray duplicate of the section rules inside the
  `prefers-reduced-motion` block, which would otherwise put the centring back for reduced-motion
  users.
- `e2e/cards.spec.ts`, `e2e/shop.spec.ts`: browser checks for left alignment, a visible separator,
  and no corners.
- The battle screen, the style guide, and the corner primitive in global styles are unchanged.
