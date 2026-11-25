## 1. Model

- [x] 1.1 In `card.ts`, add `collectionNumber(card)` (`FC #1`) and export `STARS_MIN` and `STARS_MAX`.
      Verify with `card.spec.ts`: one-digit and two-digit numbers, and `cardKey` unchanged.
- [x] 1.2 In `exchange.ts`, replace `ROSARY_PRICE_PER_STAR` with `ROSARY_RATES` and its load-time
      assertion, and derive `salePrice`, `purchasePrice`, and `unitPrice` from it. Rewrite the amounts
      in `exchange.spec.ts`. Verify that all twelve rates match the spec's table, that sell is below
      buy for each, and that `grep -rn ROSARY_PRICE_PER_STAR src` is empty.
- [x] 1.3 In `user.ts`, add `milestones` to `UserState` and `withMilestones`, and apply it in
      `seedUser`. Verify with `user.spec.ts`: a new user's milestones, raising, never lowering, the
      same object returned when nothing changes, and an empty collection.
- [x] 1.4 Add a Vitest helper that adds a six-star card to `CARD_DB` and `CARD_BY_KEY` for one test.
      Verify with a spec that both are unchanged afterwards.
- [x] 1.5 In `exchange.ts`, add `knowsRate` and `rosaryRates(state)`, and make `settleOrder` refuse a
      purchase whose rate is unknown. Verify with `exchange.spec.ts`: 9998, 9999, spent 9999, a
      six-star card held then sold, five and six listed rates, and an unknown purchase refused even
      when its order's sales would pay for it.
- [x] 1.6 In `cart.ts`, make `maxPending`, `raiseRefusal`, and `setQuantity` take whether the rate is
      known, with a bound of 0 and the design's reason when it is not. Verify with `cart.spec.ts`.
- [x] 1.7 Move persistence to schema version 4: write and parse `milestones`, read `rosaries` for
      versions 3 and 4, and apply `withMilestones` in `fromPersisted`. Verify with
      `user-store.spec.ts`: versions 1, 2, and 3 upgrade (version 3 keeping its Rosaries), a round
      trip after spending 9999, a stale milestone raised, and each impossible milestone costing only
      itself.

## 2. Services

- [x] 2.1 Route every `UserService` mutation through one `commit` that applies `withMilestones` and
      persists. Verify with `user.service.spec.ts`: a pack grant, a sale, a purchase, and a reset each
      leave the right milestones, only the settled balance counts, no state is observable with the
      card but not the milestone, and a refusal still writes nothing.
- [x] 2.2 Pass the known rate through `CartService`. Update its specs to the new prices. Verify with
      `cart.service.spec.ts`: an unknown purchase adds no line, and becomes available once the rate is
      known.

## 3. Shared pieces

- [x] 3.1 Use `collectionNumber`'s format on the card plate and in the card's description. Verify with
      `card.spec.ts` (`#2`, `FC #2`), and that `grep -rnE "padStart" src` is empty once 4.1 is done.
- [x] 3.2 Add `opensDialog` to `CardComponent`. Verify with `card.spec.ts`: `aria-haspopup` set and
      `aria-pressed` absent with it, and the reverse without it.
- [x] 3.3 Add the segmented control to `primitives.css` with its gold and soul accents, and a style
      guide section showing both, with and without a field, focused, unavailable, and not editable,
      plus a row at 9999. Verify on the style guide page with a Playwright check of shared edges,
      equal dimensions between accents, and an unclipped focus outline.
- [x] 3.4 Make `QuantityStepper`'s value a field with a draft, an `entered` output, and an `editable`
      input, drawn as a segmented bar with a projected end cap. Verify with
      `quantity-stepper.spec.ts`: Enter and blur commit once between them, non-digits are dropped,
      empty and Escape restore, Escape propagates only without a draft, a clamped value is redrawn
      even when the value didn't change, and not-editable stays focusable.
- [x] 3.5 Teach `trapTab` about `input`. Verify with `cart-dialog.spec.ts` that Tab reaches a row's
      field and still wraps at both ends, and that `confirm-dialog.spec.ts` passes unchanged.
- [x] 3.6 Add one helper for a Rosary amount in words, with the singular, and use it for row
      descriptions, the confirm label, and effect text. Verify with `cart-dialog.spec.ts` and
      `collection.spec.ts` at amounts of 0, 1, and more.

## 4. Collection page

- [x] 4.1 Use `collectionNumber` on the tile. Verify with `collection.spec.ts`: `FC #1` and `FC #10`.
- [x] 4.2 Lay the rows out as label with price beneath, reserved warning slot, and segmented bar with
      the `↓9`/`↑9` end cap, gold for Sell and soul for Buy. Remove the price `title`. Verify with
      `collection.spec.ts`: visible prices per rarity, described prices, and no price for a six-star
      card whose rate is unknown, with its price space kept.
- [x] 4.3 Wire typed quantities into the rows, without announcing a change that didn't happen. Verify
      with `collection.spec.ts`: every scenario in "A pending quantity can be typed", and the Buy row
      unavailable with its reason for an unknown rate.
- [x] 4.4 Make each tile's card open `CardReader` with no action, for owned and unowned cards. Verify
      with `collection.spec.ts`: it opens, offers only Close, leaves the cart alone, and focus returns.
- [x] 4.5 Create `src/components/exchange-rates/` (purse button, chevron, and panel) and use it as the
      purse. Verify with its spec: name and expanded state, six or five lines, nothing mentioning six
      while unknown, and each way of closing.

## 5. Cart dialog

- [x] 5.1 Wire typed quantities into the rows with the accented bar, raising a typed zero to 1, and
      widen the stepper column as needed. Update its specs to the new prices. Verify with
      `cart-dialog.spec.ts`: typing, the 99 bound, zero, Escape with and without an edit, and a typed
      unaffordable quantity followed directly by confirm.

## 6. Decks page

- [x] 6.1 Make selecting a card in either region open the reader with `opensDialog` set, and remove
      the menu state from `Decks`. Verify with `decks.spec.ts`: one activation reads, and closing
      returns focus.
- [x] 6.2 Add the always-visible add button to each collection tile, fed by `addReason`. Verify with
      `decks.spec.ts`: label follows the deck, no-deck wording, each reason, inert when unavailable,
      and no reader opened.
- [x] 6.3 Add the always-visible `Remove` beneath each filled deck position, with the strip in every
      position's height and the focus rule. Verify with `decks.spec.ts`: the three focus outcomes and
      the right copy removed.
- [x] 6.4 Remove the badge's check, keeping the inverted fill. Verify with `decks.spec.ts` that an
      exhausted badge has the class and no mark.
- [x] 6.5 Delete `src/components/card-menu/`. Verify that `grep -rniE "card-?menu" src e2e` is empty
      once 7.2 is done and that `ng build` passes.

## 7. Browser verification

- [x] 7.1 Update the stored record in `e2e/helpers.ts` to version 4 and the exchange helpers to read a
      field, then update the amounts in `e2e/collection.spec.ts`. Add checks for: bars joined and
      aligned, nothing overflowing at three-digit quantities, typing through the page and the dialog,
      the dropdown fitting and moving nothing at each viewport, its hidden and earned line, and
      reading an owned and an unowned card. Verify with `npm run e2e -- collection`.
- [x] 7.2 Rework `e2e/decks.spec.ts` from the menu to the buttons. Add checks for: buttons overlapping
      neither card nor badge, tile and position sizes unchanged by availability or filling, the fit
      ladder with the Remove strip, and the exhausted badge's lightness contrast. Verify with
      `npm run e2e -- decks`.
- [x] 7.3 Update `e2e/reduced-motion.spec.ts` for both pages. Verify with
      `npm run e2e -- reduced-motion`.
- [x] 7.4 Run `ng build`, `npx ng test --watch=false`, and `npm run e2e` in full, and look through the
      Collection, cart, dropdown, and Decks screenshots in `test-results/` at the largest and smallest
      viewports. Verify that everything passes and note what was reviewed.
