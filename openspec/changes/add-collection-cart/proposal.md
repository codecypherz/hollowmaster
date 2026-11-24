## Why

Every buy and sell on the Collection screen takes effect the moment it is clicked, one copy at a
time. Trading several cards takes many clicks, and the player can't see what a set of trades will
cost before committing to it. A cart lets the player line up trades, see their combined effect on
Rosaries, and then commit or abandon them together.

## What Changes

- **Buying and selling become pending.** The controls on the Collection screen add to a cart.
  Nothing is bought or sold, and no Rosaries move, until the player confirms the cart.
  **BREAKING** for the current one-click exchange.
- **A cart control in the top-left corner** of the Collection screen is always shown, with the
  number of cards pending.
- **A cart dialog** opens from that control. Each pending card is a single row of text, not a
  rendered card: whether it is a sell or a buy, its name, an adjustable quantity, its effect on
  Rosaries, and a remove control. The dialog shows the current balance, the net change, and the
  balance after. Its confirm button states the net Rosaries gained or spent, and activating it
  performs every sale and purchase as one step.
- **Only the net has to be affordable.** Pending sales can pay for pending purchases. The player
  may add more than they can afford, in which case the dialog states the shortfall and confirm is
  unavailable.
- **One direction per card.** A card is pending as a sell or as a buy, never both. Raising one
  quantity resets the other to 0.
- **The cart lasts until the page is reloaded.** It survives moving between pages, is never
  persisted, and is emptied by confirming or by the Decks page's data reset.
- **A frame around each card** on the Collection screen, following the player's sketch:
  - the collection number (such as `FC 001`) at the top;
  - the card below it, drawn exactly as it is today, with its `2 held` or `Not owned` badge;
  - a **Sell** row with minus, quantity, plus, and a `↓9` button. `↓9` sets the quantity that
    leaves 9 copies, and is unavailable at 9 copies or fewer;
  - a **Buy** row with minus, quantity, plus, and an `↑9` button. `↑9` sets the quantity that
    brings the player to 9 copies, and is unavailable at 9 copies or more.
- **Prices leave the face of the tile**, as in the sketch. Each row's price per copy is available as
  its tooltip and to assistive technology, and the cart shows the amounts.
- **The deck warning moves with the decision.** A pending sale that would take cards out of decks is
  marked on its Sell row and in its cart row, naming the decks.

## Capabilities

### New Capabilities

- `cart`: The pending order of sales and purchases: what it holds and for how long, the control that
  opens it, the dialog that reviews and adjusts it, what its confirm control states, and what
  confirming does.

### Modified Capabilities

- `collection`: The one-copy Buy and Sell controls are replaced by the framed tile with its
  collection number, Sell row, and Buy row. The immediate-exchange and exchange-announcement
  requirements are removed. The purse, progress, owned marks, fit, keyboard, and reduced-motion
  requirements are updated for pending exchanges and the cart control.
- `user/data-model`: One-copy buying and selling is replaced by an order of sales and purchases that
  settles as one step and is affordable on its net.
- `user/persistence`: The cart is stated not to be part of the persisted user, and its pending
  contents are not an unsaved-changes state.

## Impact

- **Model**: `src/model/exchange.ts` (settling an order, and deck-trim previews for a quantity) and
  a new `src/model/cart.ts`.
- **Services**: `src/services/user.service.ts` (`buyCard` and `sellCard` give way to settling an
  order) and a new cart service.
- **UI**: `src/components/collection/` (framed tiles and the cart control), a new cart dialog, and a
  new quantity stepper shared by the tiles and the dialog. `src/components/decks/decks.ts` empties
  the cart on reset. The shared card renderer is not changed.
- **Tests**: Vitest for settling, cart rules, the tile rows, and the dialog. `e2e/collection.spec.ts`
  and the Collection case in `e2e/reduced-motion.spec.ts` are rewritten for the new flow.
- **No** storage schema change, new dependency, or new route.
- **Spec housekeeping**: the Purpose in `openspec/specs/collection/spec.md` still describes the old
  Cards page and is corrected by hand.

## Non-goals

- Undo after confirming, or an "empty the cart" control.
- Typing a quantity directly. Quantities change through buttons.
- Any change to prices, to how Rosaries are earned, or to the card renderer.
- Showing the cart on any page other than Collection.
