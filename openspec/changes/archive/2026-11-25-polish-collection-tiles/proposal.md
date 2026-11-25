## Why

The space in `FC #1` splits one identifier into two pieces, most visibly in small, letter-spaced
type. On the Collection screen, each row's label and price sit against the left of their column, so
they look lopsided beside the bar.

## What Changes

- **Collection numbers read `FC#1`.** The space between the set code and the pound sign goes,
  everywhere the number is drawn or announced: the Collection tile's frame, the card face's plate,
  and the card's accessible description.
- **Sell and Buy labels and prices are centred.** On each Collection tile, the label and the price
  under it are centred in the column to the left of the row's bar. The bars, the tile's size, and
  the deck-warning mark's place beside the label are kept.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `design-system/card`: the card's collection identity has no space in it.
- `collection`: the tile's collection number has no space in it, and each row's label and price are
  centred in their column.

## Impact

- `src/model/card.ts` (`collectionNumber`), `src/components/card/card.css` (the plate's gap), and
  `src/components/collection/` (comments and the row's styles).
- Unit tests in `card.spec.ts` (model and component) and `collection.spec.ts`, and browser checks in
  `e2e/card-rendering.spec.ts` and `e2e/collection.spec.ts`.
- No change to stored data, card keys, prices, or the cart dialog.
