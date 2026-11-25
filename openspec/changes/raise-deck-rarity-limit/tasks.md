## 1. The limit

- [x] 1.1 In `src/model/deck.ts`, set `RARITY_LIMIT.allowed` to 2. In `src/model/deck.spec.ts`, update
      the tests that reach the limit: the constant's test; a full deck with two high-rarity cards is
      Ready, both as two different cards and as two copies of Goam; three different four-star cards,
      three Goam, and two four-star cards plus a five- or six-star card are each Invalid, reporting
      `held: 3, allowed: 2`; the both-problems test (three Goam and three low cards, Invalid first,
      `needed: 3`); battle eligibility at two and at three; and "building past the rarity limit", where
      a second card is accepted and leaves the deck not Invalid, a third is
      accepted and makes it Invalid, and removing one restores validity. Verify with `ng test`.

## 2. The error's wording

- [x] 2.1 In `standingLine` in `src/components/deck-bar/deck-bar.ts`, choose "is" or "are" from
      `problem.allowed`, so the error reads `3 cards of 4★ or more — only 2 are allowed. Remove 1.`
      In `e2e/decks.spec.ts`, update "the deck states its standing": hold three Goam; assert two in the
      deck raise no error; add the third and expect `only 2 are allowed`, `Remove 1`, and
      `6 more cards`; remove one and expect the error gone with two left; then fill with seven starters
      to reach Ready. Verify with `npm run e2e -- decks` and review
      `test-results/decks-standing-both.png`.

## 3. Whole-change verification

- [ ] 3.1 Run `ng test`, `ng build`, and `npm run e2e`, and verify that all three pass. Verify that
      `grep -rnE "only 1 is allowed|allowed: 1" src e2e` is empty.
