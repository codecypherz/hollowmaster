## Why

The Collection and Decks screens handle the same cards differently. A card can be read on one and
not the other, and deck actions are hidden behind a menu. Rosary prices can't be seen at a glance,
quantities can only be stepped one at a time, and a flat price per star makes rare cards cheap
compared with common ones.

## What Changes

- **Collection numbers read `FC #1`.** Every place that draws or announces a card's set and number
  uses a pound sign and no zero padding, replacing `FC 001`.
- **Clicking a card reads it**, on both Decks and Collection, owned or not. **BREAKING** for the
  Decks screen's action menu, which is removed.
  - Every collection tile on Decks always shows its `Add to Deck N` button, and every filled deck
    position always shows `Remove`. An `Add` that can't be taken stays in place, unavailable, and
    says why.
  - The reader keeps its add or remove action on Decks. On Collection it only reads.
- **The Sell and Buy rows are redrawn** as segmented bars: minus, quantity, plus, and the `↓9` or
  `↑9` target joined in one control. Sell is gold and Buy is soul blue. Each row shows its price per
  copy under its label.
- **The Decks badge loses its checkmark.** When every held copy is in the deck, it keeps the
  inverted gold fill alone.
- **Quantities can be typed**, on Collection tiles and in the cart dialog, within the same bounds as
  the plus and minus controls.
- **The Rosary purse becomes a button with a down chevron on its left.** It opens a dropdown listing
  the sell and buy rate of each rarity.
- **Rosary prices come from a stated rate per rarity.** **BREAKING** for every current price. The
  table lives in the model and is the only source for showing and charging prices.

  | Rarity | Sell | Buy  |
  | ------ | ---- | ---- |
  | 1      | 1    | 4    |
  | 2      | 3    | 12   |
  | 3      | 9    | 27   |
  | 4      | 33   | 99   |
  | 5      | 330  | 660  |
  | 6      | 5000 | 9999 |

- **The rarity 6 rate is hidden until earned**: the player has at some time held a six-star card, or
  has at some time had 9999 or more Rosaries. Until then its line is left out of the dropdown, its
  tiles show no price, and six-star cards can't be bought. Once earned, it stays visible, even if the
  card is sold or the Rosaries are spent.
- **The user records two milestones**: the most Rosaries ever held and the highest rarity ever held.
  Stored records move to schema version 4. Older records are upgraded from what they currently hold.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `collection`: the collection number format, reading a card from its tile, the segmented Sell and
  Buy rows with visible prices and typed quantities, and the purse's exchange-rate dropdown.
- `cart`: typed quantities in the dialog, the bound on a six-star purchase, and scenario amounts at
  the new rates.
- `decks`: selecting a card reads it, always-visible `Add to Deck` and `Remove` buttons replace the
  action menu, and the exhausted badge has no checkmark.
- `user/data-model`: the rate table, the milestones, when the rarity 6 rate is known, and refusing a
  six-star purchase before then.
- `user/persistence`: milestones are persisted, with schema version 4 and the upgrade from 1 to 3.
- `design-system/card`: the collection identity's format, and a card that opens its reading
  presentation.
- `design-system/primitives`: adds a segmented control for a joined row of buttons and a field.
- `design-system/style-guide`: covers the segmented control.

## Impact

- **Model**: `src/model/exchange.ts`, `src/model/user.ts`, `src/model/cart.ts`, `src/model/card.ts`.
- **Services**: `src/services/user.service.ts`, `src/services/cart.service.ts`.
- **UI**: `collection`, `cart-dialog`, `quantity-stepper`, `decks`, `deck-bar`, `collection-grid`,
  `card`, `card-reader`, `focus-trap`, `style-guide`, and `src/styles/primitives.css`. A new
  exchange-rates component. `card-menu` is deleted.
- **Stored data**: schema version 4. Version 3 records keep their Rosaries, cards, and decks.
- **Tests**: Vitest specs that state prices or use the menu, and the Collection, Decks, and reduced
  motion Playwright specs.
- **Ordering**: `add-collection-cart` is complete, already synced, and not yet archived. This change
  builds on the synced specs. Archive that one first.

## Non-goals

- Adding a six-star card to the catalogue, or converting existing Rosary balances to the new rates.
- Buying or selling from the reading presentation on the Collection screen.
- Changing how packs are priced in Geo.
