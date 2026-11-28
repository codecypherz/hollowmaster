## 1. Catalogue swap

- [ ] 1.1 In `src/model/card.ts`, delete the old 15-card `CARD_DB` array and rename `NEW_CARD_DB` to `CARD_DB` (type `Card[]`); verify `grep -rn NEW_CARD_DB src e2e` finds nothing
- [ ] 1.2 Rename card #34 to `Cornifer (Forgotten Crossroads)`; copy every other card exactly as entered; verify by diffing the new array against the `NEW_CARD_DB` block in `git show HEAD:src/model/card.ts`, where the only difference is that name
- [ ] 1.3 Update `card.spec.ts` (catalogue size 43, `FC#7` is Aspid Hunter, any other numbered lookups) and verify `ng test` passes for `src/model/card.spec.ts`

## 2. Starter set and save renumbering

- [ ] 2.1 In `src/model/user.ts`, set `STARTER_CARD_KEYS` to `FC#1, 3, 5, 2, 9, 11, 12, 13, 14` (same names, same order) and reword the doc comment's "exactly the one-star cards today"; verify the module loads (`assertStarterSet`) and the starter tests in `user.spec.ts` pass once their numbers are updated
- [ ] 2.2 Add the first-catalogue renumbering table (`{ from, name, to }` × 15, per the spec table) and a module-load assertion that each `to` resolves to a card named `name` and the `to` values are distinct; verify with a unit test that a mismatched row throws
- [ ] 2.3 Raise `SCHEMA_VERSION` to 6, add `VERSION_BEFORE_RENUMBERING = 5` to the recognised versions, and update the version doc comment; verify a version 6 record round-trips through `toPersisted`/`parsePersistedUser` unchanged
- [ ] 2.4 In `parsePersistedUser`, translate collection entries and deck refs of records at versions 1–5 through the table, dropping a first-catalogue number with no row; verify with unit tests for each `specs/user/persistence` scenario (owned cards kept, deck order kept, every earlier version translated, version 6 untranslated, `FC#16` dropped, balances/milestones/battle deck intact)
- [ ] 2.5 Update the existing upgrade tests in `user.spec.ts` and `src/services/user-store.spec.ts` / `user.service.spec.ts` so version 1–5 fixtures assert translated cards, and add a service-level test that a version 5 record is rewritten at 6 and a reload restores the same cards; verify those spec files pass

## 3. Unit test fixtures

- [ ] 3.1 Renumber every `cardKeyOf('FC', n)` that names one of the 15 old cards across `src/**/*.spec.ts`, per the table, keeping or correcting its comment; verify `grep -rn "cardKeyOf('FC'" src` shows only current numbers and each comment names the card at that number
- [ ] 3.2 Replace Goam where a test uses it as the four-star card (`exchange-rates.spec.ts`, `decks.spec.ts`, `deck.spec.ts`, `collection.spec.ts`, `user.service.spec.ts`, `pack-opening.spec.ts`, etc.) with False Knight (`FC#17`), adjusting any price or dwell expectation derived from its stars; verify those spec files pass
- [ ] 3.3 Restate the `pack.spec.ts` renormalization test to draw from `CARD_DB` filtered to ≤ 4 stars, keeping its effective-odds table; verify `ng test` passes for `src/model/pack.spec.ts`
- [ ] 3.4 Correct the "no real card has six stars yet" comment in `src/testing/six-star.ts`; verify `six-star.spec.ts` passes
- [ ] 3.5 Run the full `ng test` suite and verify it passes with no skipped or focused tests

## 4. Browser suite

- [ ] 4.1 In `e2e/helpers.ts`, make `storeUser` write version 6 and set `STARTER_REFS` to the new starter numbers; renumber `GOAM`, `CRAWLID`, and every other `{ set: 'FC', number }` fixture in `e2e/*.spec.ts`, swapping Goam-as-four-star for False Knight (`FC#17`); verify `grep -rn "number: " e2e/*.ts` matches the table
- [ ] 4.2 Run `npm run e2e`; where `combat.spec.ts` or `reduced-motion.spec.ts` no longer reaches its combat, find new seeds offline with a throwaway Vitest spec replaying `playUntil` against `GameService`, then verify the full `npm run e2e` suite passes
- [ ] 4.3 Add an e2e check (or extend an existing one) that a stored version 5 record holding Gruz Mother as `FC#2` shows Gruz Mother on the Collection page; verify it passes

## 5. Final check

- [ ] 5.1 Run `ng build` and verify it succeeds; open the Collection page in the dev server and confirm all 43 Forgotten Crossroads cards appear, numbered FC#1–FC#43, with the corrected Cornifer name
