## 1. Collection number

- [x] 1.1 In `src/model/card.ts`, make `collectionNumber` return `FC#1` and update its comment to say it
      is display text that happens to match `cardKey`. Update the `FC #1` comment in `collection.ts`.
      Verify with `src/model/card.spec.ts` (`FC#1`, `FC#10`, the contrasting test reworded),
      `card.spec.ts` (description ends `FC#2`), and `collection.spec.ts` (tiles read `FC#1`, `FC#10`),
      and that `grep -rn "FC #" src e2e` is empty.
- [x] 1.2 Remove the `gap` from `.cf-plate` in `card.css`, keeping both spans. Verify with a check in
      `e2e/card-rendering.spec.ts` that, at the ability gate and at a larger size, the number's left
      edge meets the set's right edge within 0.5px.

## 2. Sell and Buy rows

- [x] 2.1 In `collection.css`, widen the label cell to 52px with the rows' -6px left margin, balance
      `.row-head`'s tracks around the label, and centre the price, as in design.md. Verify by extending
      the frame check in `e2e/collection.spec.ts` at both sizes: each label's and each price's centre is
      within 1px of the midpoint between the frame's inner left edge and the bar's left edge, on the
      warned tile too.
- [x] 2.2 In the same check, add the Sell row's label and price to the parts that must not move when the
      warning arrives. Verify it passes along with the existing overlap, overflow, and bar alignment
      assertions, and review the `collection-tile-*` screenshots in `test-results/`.

## 3. Whole-change verification

- [x] 3.1 Run `ng test`, `ng build`, and `npm run e2e`, and verify that all three pass.
