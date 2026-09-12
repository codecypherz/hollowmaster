## 1. The deck model

- [ ] 1.1 Create `src/model/deck.ts` with `Deck { readonly cards: readonly CardKey[] }`, `MAX_DECKS = 9`, and `DECK_SIZE = HAND_SIZE` imported from `src/model/game.ts` rather than restated. Verify a unit test asserts `DECK_SIZE === HAND_SIZE` and that both constants are 9.
- [ ] 1.2 Add `deckName(index): string` returning `Deck ${index + 1}`. Verify unit tests assert index 0 gives `Deck 1` and index 8 gives `Deck 9`.
- [ ] 1.3 Implement `createDeck(state): UserState | null` — appends an empty deck, refuses at `MAX_DECKS`. Verify unit tests assert a user with two decks gains an empty third at the end, that the ninth creation succeeds and the tenth returns `null`, and that a refusal leaves the input state untouched by identity.
- [ ] 1.4 Implement `deleteDeck(state, deckIndex): UserState | null` — removes that deck, returns `null` for an index no deck occupies. Verify unit tests assert deleting the first of three leaves the other two with their exact contents in order, that the collection and Geo are unchanged, and that an out-of-range index returns `null`.
- [ ] 1.5 Implement `addCardToDeck(state, deckIndex, card): UserState | null` — appends to the first free position, refusing when the deck holds `DECK_SIZE` cards, when the index names no deck, or when `quantityOf(collection, card)` is zero. Verify unit tests assert the three refusals each return `null` and change nothing, and that a card held once can be added nine times to one deck.
- [ ] 1.6 Implement `removeCardFromDeck(state, deckIndex, position): UserState | null` — removes the card at that position, closing the gap, refusing for a position no card occupies. Verify unit tests assert removing the second of three copies leaves two, that the remaining cards keep their relative order with no gap, and that an out-of-range position returns `null`.
- [ ] 1.7 Confirm no deck operation mutates its input: every one returns a new `UserState` with new arrays. Verify a unit test holds references to the original state, its decks array, and one deck's cards array across each operation and asserts none of the three changed.
- [ ] 1.8 Confirm deck operations never touch the collection or the balance. Verify a unit test applies a long scripted sequence of creates, deletes, adds, and removes and asserts the collection map and `geo` are equal to their starting values throughout.

## 2. The collection projection and its orders

- [ ] 2.1 Create `src/model/collection.ts` with `OwnedCard { card, quantity }` and `ownedCards(collection): OwnedCard[]`, walking `CARD_DB` in catalogue order and keeping only cards held at a quantity of one or more. Verify unit tests assert a collection of three copies of one card and one of another yields two entries with quantities 3 and 1, that a card held zero times is absent, and that two collections built by inserting the same cards in different orders yield the same sequence.
- [ ] 2.2 Add `SortKey`, the `SORTS` table naming the five orders with their player-facing labels and their fixed directions (rarity, quantity, attack, defense descending; name ascending), and `DEFAULT_SORT = 'rarity'`. Verify unit tests assert exactly five orders, that each has a distinct key and a non-empty label, and that the default is rarity.
- [ ] 2.3 Implement `sortOwned(owned, key): OwnedCard[]` with the tie-break ladder from `design.md` decision 3 — primary value, then name via `localeCompare('en')`, then `cardKey`. Verify unit tests assert rarity puts a 4-star before a 1-star, quantity puts a card held 3 times before one held once, name reads A→Z, and attack and defense each put the higher value first.
- [ ] 2.4 Verify every order is total and stable: a unit test sorts a fixture containing cards that tie on each sortable value, asserts the sequence is identical across repeated calls, asserts sorting by another key and back reproduces the first sequence exactly, and asserts no two entries compare as equal under any of the five orders.
- [ ] 2.5 Confirm `sortOwned` does not mutate its input array. Verify a unit test asserts the input's order is unchanged after sorting and that the returned array is a different object.

## 3. Decks in the user record

- [ ] 3.1 Add `decks: readonly Deck[]` to `UserState` in `src/model/user.ts`. Verify `ng build` succeeds and every existing `user.spec.ts` test still passes.
- [ ] 3.2 Extend `seedUser()` to seed exactly one empty deck alongside the nine starter cards and zero Geo. Verify unit tests assert a seeded user holds one deck, that it holds zero cards, that the nine starter cards and zero Geo are unchanged, and that two independent seeds are equal.
- [ ] 3.3 Confirm the existing collection and Geo helpers are untouched by the new field. Verify `quantityOf`, `grantAll`, `totalCards`, and `distinctCards` still pass their existing tests unmodified.

## 4. Persistence at version 2

- [ ] 4.1 Move `SCHEMA_VERSION` to 2 and add `PersistedDeck` to the persisted shape — a deck as an ordered array of `{ set, number }` entries — alongside the existing collection entries. Verify a unit test asserts a persisted record carries `version: 2` and a `decks` array, and that no card name, artwork, stat, arrow, or ability text appears anywhere in the serialized JSON.
- [ ] 4.2 Extend `toPersisted` to write the decks in order, dropping any key the catalogue cannot resolve, and `fromPersisted` to read them back. Verify a unit test round-trips a user with three decks — one empty, one holding duplicates, one full — and asserts the restored decks are equal to the originals in order, contents, and positions.
- [ ] 4.3 Make `parsePersistedUser` dispatch on the version rather than demand equality: version 2 parses fully, an unrecognised version still returns `null`. Verify unit tests assert a version 2 record parses, a version 3 record returns `null`, a non-object root returns `null`, and an invalid `geo` returns `null`.
- [ ] 4.4 Add the version 1 reader: a version 1 record is read with the existing rules and upgraded to `{ ...v1, decks: [] }`. Verify unit tests assert a stored version 1 record restores its full collection and balance, that the restored user holds no decks, and that a version 1 record naming an unknown card still drops only that card.
- [ ] 4.5 Validate deck entries per entry on load: drop a position whose card is not in the catalogue, drop a position whose card the restored collection does not hold, drop a deck that is not an array of entries at all, keep the first nine decks, and keep the first nine positions of a deck. Verify unit tests cover each case and assert that in every restored record, every card in every deck reports a collection quantity of at least one.
- [ ] 4.6 Make `UserService.load()` write back after an upgrade, so a version 1 record becomes a version 2 record without the player taking an action. Verify a unit test against an in-memory store holding a version 1 record asserts a version 2 record is written during load and that a second load restores it directly.

## 5. The user service's deck commands

- [ ] 5.1 Add `createDeck()`, `deleteDeck(index)`, `addCardToDeck(index, card)`, and `removeCardFromDeck(index, position)` to `src/services/user.service.ts`, each applying the corresponding model function in one `_state.update()`, returning `false` and persisting nothing when the model refuses, and persisting once when it applies. Verify unit tests assert one store write per successful command, none for a refused one, and the correct boolean from each.
- [ ] 5.2 Add a `decks` computed projection beside `geo` and `collection`. Verify a unit test asserts a freshly constructed service exposes the one seeded empty deck and that the signal emits after each successful command.
- [ ] 5.3 Confirm no deck command can change the collection or the balance. Verify a unit test observes `geo` and `collection` across every command and asserts neither emits a changed value.

## 6. The shared fit helper

- [ ] 6.1 Move `Extent`, `MIN_SCALE`, and `fitOverlay()` from `src/components/pack-opening/pack-opening.ts` to `src/model/fit.ts` and import them back into `pack-opening.ts`. Verify the existing `fitOverlay` unit tests pass unchanged against the new location and that `npm run e2e -- shop` still passes.

## 7. The card action menu

- [ ] 7.1 Create `src/components/card-menu/` as a standalone component taking the primary action's label and availability plus a reason to state when it is unavailable, and emitting `primary` and `read`. Verify unit tests assert both outputs emit once per activation and that the primary action is not rendered as an activatable control when unavailable.
- [ ] 7.2 Position the menu absolutely within its host tile and style it from the existing gold and soul ramps with no new token. Verify in the browser that opening a menu leaves every other card on the page at its original position and size, and that `git diff src/styles/tokens.css` is empty.
- [ ] 7.3 Make the menu keyboard operable: focus moves to its first control on open, Escape closes it, and closing returns focus to the card. Verify in the browser that the menu can be opened, acted on, and dismissed without a pointer.

## 8. The card reader overlay

- [ ] 8.1 Create `src/components/card-reader/` as a `role="dialog" aria-modal="true"` overlay rendering one `<app-card>` at a width above the renderer's 200px ability gate, taking the card and the deck action available for it, and emitting that action and `close`. Verify in the browser that the read card shows its ability text, set, and number.
- [ ] 8.2 Confine focus to the overlay while it is open and return focus to the card it was opened from on close; close on Escape and on the explicit control. Verify in the browser by opening the reader from a card by keyboard, cycling focus, closing, and observing focus back on that card.
- [ ] 8.3 Offer the same deck action the card's menu offered — add when read from the collection, remove when read from the deck — withheld under the same conditions with the same stated reason. Verify in the browser that reading a collection card with a full deck offers no add and states why, and that reading a deck card offers removal.

## 9. The pinned deck region

- [ ] 9.1 Create `src/components/deck-bar/` rendering the deck tabs as an ARIA tablist — one tab per deck labelled by `deckName`, roving tabindex, arrow-key movement, the selected tab marked by a non-colour cue as well as colour. Verify in the browser that three decks yield three tabs, that the selection can be changed by keyboard alone, and that the selected tab is distinguishable with colour removed.
- [ ] 9.2 Render the selected deck's nine positions in one row, filled positions rendering `<app-card>` and free positions rendering a visibly empty slot in the `slot` / `slot-empty` vocabulary the hand rack uses. Verify in the browser that a four-card deck shows four cards and five empty positions, and that an empty deck shows nine empty positions.
- [ ] 9.3 State how many of the nine positions are filled, and state the empty-deck case in words as well. Verify in the browser that a four-card deck reads as four of nine and an empty one says so and points at the collection below.
- [ ] 9.4 Lay the positions out at a fixed `--deck-cw` of 128px and scale the whole region with `fitOverlay()` measured against its available width, sizing the region's wrapper from the same scale so the collection below starts at the right place. Verify in the browser at 1920, 1440, 1366, and 1100 wide that no card is laid out below 120px, that the whole row is on screen, and that the collection begins immediately below the region with no gap or overlap.
- [ ] 9.5 Add the create-deck control, absent rather than disabled at nine decks with the limit stated. Verify in the browser that creating a deck adds a tab, selects it, and shows nine empty positions, and that at nine decks no create control is present or reachable.
- [ ] 9.6 Add the delete control and its `role="alertdialog"` confirmation naming the deck. Verify in the browser that declining leaves the deck intact and still on screen, that confirming removes it and renumbers the remaining tabs with no gap, that another deck becomes the one on screen, and that deleting the last deck leaves the no-decks state.

## 10. The collection grid

- [ ] 10.1 Create `src/components/collection-grid/` rendering `ownedCards()` through `<app-card>` in a `repeat(auto-fill, var(--tile-w))` grid with `--tile-w: 150px`, centred. Verify in the browser at 1920 and at 1100 wide that every tile's card measures at least 120px and less than 200px and that no ability text is visible on any tile.
- [ ] 10.2 Draw the count badge over the bottom of each tile, straddling the card's lower rim in the gap between the S and SE chevrons, stating the quantity for every tile including a card held once. Verify in the browser that all eight chevrons, the name, all five star slots, and both labelled stat bars remain visible with the badge up, and that a card held three times reads three.
- [ ] 10.3 Make each tile use the renderer's `interactive` / `selectable` / `selected` inputs and its `(select)` output, so the tile is a keyboard-reachable button and the menu's open state is its selected state. Verify in the browser that tabbing reaches each tile with a visible focus indicator and that activating one opens its menu.
- [ ] 10.4 Confirm the grid is the page's only scrolling region and that it scrolls within its row. Verify in the browser with a collection larger than the row that the grid scrolls, the document does not, and the pinned region does not move.

## 11. The Cards page

- [ ] 11.1 Rewrite `src/components/collection/collection.{ts,html,css}` as the two-row page — `grid-template-rows: auto 1fr; overflow: hidden` — keeping the void background, particle field, corner frame, and ornament vocabulary, and composing `deck-bar` above `collection-grid`. Verify in the browser that the page still reads as the themed Cards page and that it no longer presents itself as a placeholder.
- [ ] 11.2 Hold the screen's state: the selected deck index and the one open menu, both as signals on the component, with the selected deck clamped into range whenever the deck list shrinks. Verify unit tests assert the page opens on the first deck, that deleting the deck on screen selects a surviving one, and that deleting the last leaves no selection.
- [ ] 11.3 Render the sort control in the pinned region naming the five orders and marking the one in effect, defaulting to rarity descending. Verify in the browser that the collection arrives rarest-first, that choosing each order reorders the grid, and that the deck on screen is unchanged by a reorder.
- [ ] 11.4 Wire the collection menu's add action and the deck menu's remove action through `UserService`, withholding add with a stated reason when the deck is full and when the player holds no decks. Verify in the browser that adding a card fills the next free position and raises the filled count, that the card's badge is unchanged, that the same card can be added nine times, and that removing the second of three copies leaves the other two in order.
- [ ] 11.5 Wire the reader overlay to both regions, carrying the correct deck action for the card's origin. Verify in the browser that reading a collection card and adding from there places it in the deck, and that reading a deck card and removing from there frees that position.
- [ ] 11.6 Confirm the page presents no save control and no unsaved state. Verify in the browser that building a deck and reloading the application shows the same deck with the same cards in the same positions.

## 12. Motion and accessibility

- [ ] 12.1 Give the collection, the deck positions, the menu, and the reader their entrances from the existing `--dur-*` and easing tokens, and add a `@media (prefers-reduced-motion: reduce)` block that reduces every one of them to an immediate state change. Verify a repo search finds no hardcoded duration or easing in the new stylesheets, and that under a reduced-motion preference the selected tab, the selected card, and a card's place in the deck are all still distinguishable.
- [ ] 12.2 Walk the whole screen by keyboard alone — tabs, create, delete and its confirmation, a collection tile, both menu actions, the reader and its action, and dismissal of each. Verify every step is reachable with a visible focus indicator and that no action requires a pointer.

## 13. Browser verification

- [ ] 13.1 Add `e2e/cards.spec.ts` and the helpers it needs to `e2e/helpers.ts` — reaching the Cards page, reading the tabs, the deck positions and their filled count, the tiles and their badges, and the open menu. Verify `npm run e2e -- cards` passes against the committed configuration with no bespoke driver introduced.
- [ ] 13.2 Cover the fit ladder at 1920×1080, 1600×900, 1440×900, 1366×768, and 1100×620: the document scrolls in neither axis, the pinned region and every one of its controls is wholly on screen, and the grid is the only element that scrolls. Verify each size also writes a review screenshot to the run's output directory, compared against nothing.
- [ ] 13.3 Cover the width bands: every collection tile's card is at least 120px and under 200px with no ability section rendered, and the reader's card is at or above 200px with its ability text, set, and number visible. Verify the assertions read the card's measured width rather than the tile's declared one.
- [ ] 13.4 Cover the badge: with a card held more than once, assert the badge states the count and that the card's name, five star slots, both stat bars, and all eight chevrons are still visible beneath it.
- [ ] 13.5 Cover the deck-building path end to end: create a deck, add the same card nine times, observe the filled count reach nine of nine, observe the add action withheld with its reason, remove one, and reload to find the deck intact.
- [ ] 13.6 Cover deletion: confirm that declining leaves the deck, that confirming renumbers the remaining tabs with no gap, and that the collection's counts are unchanged by a deletion.
- [ ] 13.7 Add the Cards page to `e2e/reduced-motion.spec.ts`'s pass. Verify the page loads under the preference, presents its cards, menus, and reader without animation, and still distinguishes the selected tab and the selected card.

## 14. Closing out

- [ ] 14.1 Run `ng test` and confirm the whole unit suite passes, including every pre-existing test unmodified except where this change deliberately changed behaviour.
- [ ] 14.2 Run `npm run e2e` and confirm the whole browser suite passes, including the game, shop, card-rendering, and reduced-motion specs that predate this change.
- [ ] 14.3 Run `ng build` and Prettier over the changed files. Verify the build succeeds and that formatting matches the project's 100-character, single-quote, `angular`-parser configuration.
- [ ] 14.4 Confirm the change's non-goals held: `git diff` shows no change to `src/services/game.service.ts`, `src/model/game.ts`, `src/components/card/`, `src/model/pack.ts`, `src/components/shop/`, or `src/styles/tokens.css` — the deal, the card renderer, pack composition, the Shop, and the token set are all untouched.
