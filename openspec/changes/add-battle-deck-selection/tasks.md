## 1. The remembered battle deck in the model

- [ ] 1.1 In `src/model/user.ts`, add `battleDeck: number | null` to `UserState`, and have `seedUser()`
      return `battleDeck: null`. Fix every `UserState` literal the compiler then flags in `src/`
      specs. Verify with `ng build` and `ng test`.
- [ ] 1.2 In `src/model/deck.ts`, add `chooseBattleDeck(state, index): UserState | null`. It refuses
      an index no deck occupies and a deck that is not `isBattleReady`. Also add
      `defaultBattleDeck(state): number | null`, which returns the remembered deck if it is Ready,
      else the first Ready index, else `null`. In `src/model/deck.spec.ts`, cover: a new user has
      none; choosing a Ready deck records it; choosing an Incomplete or Invalid deck, or an index
      out of range, returns `null`; the default with no record is the first Ready deck, the default
      with a Ready record is that record, and the default with an ineligible record falls back; and
      with no Ready deck the default is `null`. Verify with `ng test`.
- [ ] 1.3 Make `deleteDeck` keep `battleDeck` pointing at the same deck: an earlier deletion means
      `battleDeck - 1`, deleting the remembered deck means `null`, and a later deletion leaves it
      unchanged. In `deck.spec.ts`, assert each case. Also assert that `createDeck`, `addCardToDeck`,
      `removeCardFromDeck` (including one that makes the remembered deck Incomplete), `trimDecks`
      through `settleOrder`, and `withMilestones` leave `battleDeck` unchanged. Verify with
      `ng test`.

## 2. Persisting it at schema version 5

- [ ] 2.1 In `src/model/user.ts`, raise `SCHEMA_VERSION` to 5 and keep 4 as
      `VERSION_WITHOUT_BATTLE_DECK`. Add `battleDeck` to `PersistedUser` and write it in
      `toPersisted`. In `parsePersistedUser`, accept version 4 with `battleDeck: null`, and read a
      current-version value that is not a non-negative integer as `null`. In `fromPersisted`, clear
      an index at or beyond the restored deck count, and keep an index whose deck is ineligible. In
      `src/services/user-store.spec.ts`, cover: a round trip of a remembered deck; a version 4
      record upgrading with every other field intact and being rewritten at version 5 (through
      `UserService.load`); negative, fractional, string, and missing values reading as `null`
      without costing the record; and an out-of-range index reading as `null`. Update
      `cart-dialog.spec.ts` and any other `PersistedUser` literal. Verify with `ng test`.
- [ ] 2.2 In `src/services/user.service.ts`, add `battleDeck` (computed) and
      `chooseBattleDeck(index): boolean` through `apply`. In `src/services/user.service.spec.ts`,
      assert that a choice is published and persisted to the store, and that a refusal persists
      nothing. Verify with `ng test`.

## 3. Dealing the player's hand from the deck

- [ ] 3.1 Change `GameService.startGame` in `src/services/game.service.ts` to
      `startGame(deck: Deck): boolean`. It refuses a deck that is not `isBattleReady` and leaves the
      state `null`. The player's hand is the deck's cards in order, resolved through `CARD_BY_KEY`.
      The opponent's hand is `dealHands(CARD_DB, 1, HAND_SIZE)[0]`. Add a shared
      `READY_TEST_DECK` (the nine starter keys) for specs. Update every `gs.startGame()` call in
      `src/services/game.service.spec.ts` and `src/components/game/game.spec.ts` to pass it. Add
      cases: the player's hand equals the deck in order, duplicates included; an Incomplete and an
      Invalid deck each return `false` with no game started; and the opponent is still dealt nine.
      Verify with `ng test`.

## 4. The deck bar's read-only "choose" mode

- [ ] 4.1 In `src/components/deck-bar/deck-bar.ts` and `.html`, add `mode = input<'edit' | 'choose'>('edit')`,
      an `eligible` predicate input (defaulting to all eligible), and an `emptyText` input. In
      `choose` mode, do not render the separator, the create and delete controls, the delete confirm
      dialog, or the Remove strips. Ineligible deck buttons get `is-disabled`,
      `aria-disabled="true"`, a `data-tip`, and an `aria-describedby` reason built from their
      standing ("Incomplete", "Invalid", or "Invalid · Incomplete"), and their clicks emit nothing.
      Add `is-disabled` styling for `.deck-btn` in `deck-bar.css`, mirroring `.icon-btn.is-disabled`.
      Verify with `ng test`, and by running `npm run e2e -- decks` unchanged, which shows edit mode
      did not regress.

## 5. The deck selection page and route

- [ ] 5.1 Scaffold `src/components/deck-select/` (`ng generate component components/deck-select`). Give
      it the Decks page's shell: `page-wrap`, void background, mist, a particle field, the shared
      `screen-header` titled `Choose a Deck`, and no corner frame. Below that, add
      `<app-deck-bar mode="choose">` fed from `UserService.decks()`, `eligible` set to
      `isBattleReady`, and the `chosen` signal. Then add an action row holding a primary `hk-btn`
      "Begin Battle". Set `chosen` from `defaultBattleDeck`, and re-clamp it in an effect when the
      decks change. Choosing a deck calls `UserService.chooseBattleDeck` and sets `chosen`. Verify
      with a `deck-select.spec.ts` Vitest case for the default on first render.
- [ ] 5.2 Wire "Begin Battle": with a deck chosen, call `chooseBattleDeck(chosen)`, then
      `GameService.startGame(deck)`, and navigate to `/game` only on `true`. With none chosen, it is
      `aria-disabled` with the reason "Choose a ready deck to battle", stays focusable, and starts
      nothing. With no Ready deck, pass the empty text "None of your decks is ready for battle." and
      render a `routerLink="/decks"` "Build a deck" link. In `deck-select.spec.ts`, assert: begin
      starts a game with the chosen deck's cards as the hand and records the choice; begin with
      nothing chosen starts nothing; and a fresh user sees the empty text and link. Verify with
      `ng test`.
- [ ] 5.3 Selecting a deck card opens `<app-card-reader>` with no action inputs, so Close is its only
      control, and closing returns focus as the Decks page does. Honour reduced motion with the
      same `@media (prefers-reduced-motion: reduce)` treatment `decks.css` uses. Verify with a
      `deck-select.spec.ts` case that the reader opens with a single button.
- [ ] 5.4 In `src/app/app.routes.ts`, add an eager `{ path: 'battle/deck', component: DeckSelect }`
      before the wildcard. In `src/components/battle/battle.ts`, replace the `startGame`
      output and subscription with `router.navigate(['/battle/deck'])`, and drop the `GameService`
      injection. Verify with `ng build`, and by checking that the nav's Battle link is active on
      `/battle/deck` in the e2e of 6.2.

## 6. Browser verification

- [ ] 6.1 In `e2e/helpers.ts`, make `storeUser` write version 5 with an optional `battleDeck`. Add a
      `READY_STARTER_USER` (the nine starter cards, Deck 1 holding all nine) and `openDeckSelect()`.
      Make `startMatch()` store that user, then click Start Game, wait for `/battle/deck`, click
      Begin Battle, and wait for `/game`. Update the inline walk in `e2e/collection.spec.ts` to click
      Begin Battle after Start Game. Update `e2e/battle-to-game.spec.ts` so that Start Game is
      asserted to land on `/battle/deck` with no game. Verify with
      `npm run e2e -- battle-to-game collection game-fit shop`.
- [ ] 6.2 Add `e2e/deck-select.spec.ts`. Across the project's viewport ladder, including one too
      narrow for nine positions at 120px, check: no document scroll; the header, deck buttons,
      positions, and Begin Battle wholly on screen; and laid-out card width ≥ 120. Check that an
      Incomplete and an Invalid deck are disabled with their reasons and are not chosen on click.
      Check the default: with no record the first Ready deck, and after choosing Deck 3 and
      reloading, Deck 3. Check that no Add, Remove, New deck, or Delete control is present. Check
      that reading a card shows Close only and the deck does not move. Check that a fresh user sees
      the empty state, a link that reaches `/decks`, and a disabled Begin Battle that does not
      navigate. Check that Begin Battle reaches `/game`, the player rack showing the deck's cards in
      order, and the nav's Battle link is active on `/battle/deck`. Then check a keyboard-only path
      from choosing a deck to the match. Save screenshots to `test-results/` for review. Verify with
      `npm run e2e -- deck-select`.
- [ ] 6.3 Add a reduced-motion case to `e2e/reduced-motion.spec.ts`: deck selection renders with every
      deck button, position, and Begin Battle visible at once. Verify with
      `npm run e2e -- reduced-motion`.

## 7. Whole-change verification

- [ ] 7.1 Run `ng test`, `ng build`, and `npm run e2e`, and verify that all three pass. Then review
      the `test-results/deck-select-*.png` screenshots against the Decks page for matching look and
      feel. Finally, verify that `grep -rn "startGame()" src e2e` finds nothing.
