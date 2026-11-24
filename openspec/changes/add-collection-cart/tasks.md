## 1. Model and services

- [ ] 1.1 In `src/model/exchange.ts`, add `settleOrder` and give `decksTrimmedBySale` a quantity.
      Remove `buyCard` and `sellCard`. Rewrite `exchange.spec.ts`: multi-copy sale, last copy,
      over-sale refused whole, unaffordable net refused whole, sales funding purchases, net exactly
      the balance, malformed quantity and duplicate card refused, Geo untouched, and trimmed decks
      equal to those previewed for 1 and 2 copies. Verify that `ng test` passes for the file.
- [ ] 1.2 In `UserService`, replace `buyCard` and `sellCard` with `settle(order)` through `apply`.
      Move the existing cases in `user.service.spec.ts` onto it (one write on success, none on
      refusal, trimming seen in the same step, reset after a sale). Verify that
      `grep -rnE '\b(buyCard|sellCard)\b' src` finds only the Collection component, pending 3.x, and
      that the service spec passes.
- [ ] 1.3 Create `src/model/cart.ts` with the line type, bounds, and pure functions from design.md.
      Verify with `cart.spec.ts`: add, switch direction in place, zero removes, sale clamps to held,
      purchase clamps to 99, order of first addition kept, and remove.
- [ ] 1.4 Create `src/services/cart.service.ts` with the computed views, `setQuantity`, `remove`,
      `clear`, and `confirm`. Verify with `cart.service.spec.ts`: count, signed effects, net,
      balance after, shortfall, `canConfirm` (empty, short, exact, and zero net), held falling
      reduces a sale, pending lines change no user state and cause no write, confirm settles once and
      clears, and a refused confirm keeps the lines.
- [ ] 1.5 In `Decks.onReset()`, clear the cart. Verify with a `decks.spec.ts` case.

## 2. Shared pieces

- [ ] 2.1 Create `src/components/quantity-stepper/` as in design.md. Verify with a component test:
      outputs fire, unavailable ends are `aria-disabled`, focusable and inert, reasons are exposed,
      and labels name the card.
- [ ] 2.2 Extract `ConfirmDialog`'s Tab trap to `src/components/focus-trap.ts`. Verify that
      `confirm-dialog.spec.ts` still passes unchanged.

## 3. Collection page

- [ ] 3.1 Turn `.tile` into the frame: collection number (`FC 001`), the unchanged 150px card with its
      veil and badge, then the two rows. Remove the old exchange buttons and spacer. Verify with
      `collection.spec.ts`: order of contents, padded number, and the number outside `.tile-card`.
- [ ] 3.2 Build the Sell and Buy rows on the stepper and `CartService`, with `↓9` and `↑9` derived from
      `DECK_SIZE`, reasons, price tooltips, and accessible descriptions. Verify with
      `collection.spec.ts`: every scenario in the Sell row and Buy row requirements, at held counts
      0, 2, 9, and 14.
- [ ] 3.3 Add the Sell row's deck warning in its reserved slot. Verify with `collection.spec.ts`: it
      follows the pending quantity, names the decks, and is absent at zero.
- [ ] 3.4 Add the cart control as the top bar's first column, with the count and its accessible name.
      Verify with `collection.spec.ts`: shown when empty, counts copies, and singular and plural
      wording.
- [ ] 3.5 Announce pending changes from the tiles, including the cleared direction. Verify with
      `collection.spec.ts` that the text is right, focus stays on the control, and the purse, badge,
      and progress don't change. Then verify that `grep -rnE '\b(buyCard|sellCard)\b' src` is empty.

## 4. Cart dialog

- [ ] 4.1 Create `src/components/cart-dialog/` with the rows (action, name, stepper, signed amount,
      remove, deck warning) and the empty state. Verify with `cart-dialog.spec.ts`: sale and purchase
      rows, no `app-card` inside, adjust, lower stops at 1, remove with each focus destination, and
      the warning following the quantity.
- [ ] 4.2 Add the totals and the confirm control: balance, net, balance after or shortfall, signed
      label, accessible name, and unavailable reasons. Verify with `cart-dialog.spec.ts`: gain, spend,
      zero net, exact balance, shortfall, empty, and becoming available after an adjustment.
- [ ] 4.3 Add modal behaviour (focus on open, trap, Escape, scrim, focus return), the dialog's live
      region, and reduced-motion rules. Verify with `cart-dialog.spec.ts`.
- [ ] 4.4 Open it from the cart control in `Collection`, confirm through `CartService`, close, and
      announce the outcome with any trimmed decks. Verify with `collection.spec.ts`: purse, badges,
      progress, and decks follow a confirm, closing changes nothing, and focus returns to the cart
      control.

## 5. Browser verification

- [ ] 5.1 Rewrite `e2e/collection.spec.ts` and its helpers for fit and geometry at both viewports:
      only the sections scroll, cart control top-left and clear of the title and purse, card widths
      inside the no-ability band, card not overlapped by the number or rows, equal tile sizes across
      unowned, held twelve, and warned tiles, no row overflowing its frame (including a three-digit
      sale), and badges obscuring nothing. Save tile and page screenshots to `test-results/`. Verify
      with `npm run e2e -- collection`.
- [ ] 5.2 Add e2e flows: a keyboard-only buy and sell through confirm that survives a reload; pending
      lines kept through Shop and Decks and lost on reload; sales funding a purchase; a shortfall
      blocking confirm; a confirmed sale leaving a deck; and the Decks reset emptying the cart. Verify
      with `npm run e2e -- collection`.
- [ ] 5.3 Add e2e checks on the dialog: it fits at the smallest viewport with a line for every
      catalogued card, its rows scroll while the totals stay visible, and the page behind doesn't
      scroll. Save a screenshot. Verify with `npm run e2e -- collection`.
- [ ] 5.4 Update the Collection case in `e2e/reduced-motion.spec.ts` for the new rows, the cart
      control, and the dialog. Verify with `npm run e2e -- reduced-motion`.
- [ ] 5.5 Compare the tile screenshots with the sketch (number top-left, card, badge, aligned Sell and
      Buy rows, `↓9` / `↑9` at the right) and adjust the frame's spacing. Verify by re-running 5.1.

## 6. Wrap-up

- [ ] 6.1 Run Prettier on the changed files, then `ng test`, `ng build`, and `npm run e2e`. All pass.
- [ ] 6.2 Correct the Purpose of `openspec/specs/collection/spec.md`, which still describes the Cards
      page. Verify that `openspec validate --specs --strict` passes.
