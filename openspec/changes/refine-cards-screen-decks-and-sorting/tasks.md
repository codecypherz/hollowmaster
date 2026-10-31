## 1. Copy limit in the deck model

- [ ] 1.1 In `src/model/deck.ts`, add the copy-limit helpers (design §1):
  - `copiesInDeck(deck, card)`
  - `addRefusal(state, deckIndex, card)`, returning `'no-deck' | 'full' | 'unowned' | 'exhausted'
    | null`
  - make `addCardToDeck` return `null` exactly when `addRefusal` is non-null

  Rewrite the doc comment that says quantity is not a limit. Verify in `src/model/deck.spec.ts`
  under `ng test`:
  - one held copy allows one copy per deck, and the second add to the same deck is refused
  - three held allows three, and the fourth is refused
  - one held copy can sit in three different decks
  - removing a copy from an exhausted deck allows the add again
  - a refused over-limit add leaves state `===`-unchanged
  - `addRefusal` reports each of the five outcomes
  - the existing "nine copies from one" test is replaced, not deleted silently
  - a second, *different* 4★ card is still accepted (rarity is not a refusal)
- [ ] 1.2 In `src/model/user.ts#fromPersisted`, keep a deck position only while that deck's
  kept-copies count for the key is below the restored quantity, earliest copies first (design §11).
  Verify with new `src/model/user.spec.ts` (or `user-store.spec.ts`) cases:
  - four stored copies against two held restore the first two, and the deck's other positions keep
    their relative order
  - two decks each holding the one held copy both keep it
  - the existing unowned and size trims still pass

## 2. Sort direction and rarity grouping in the collection model

- [ ] 2.1 In `src/model/collection.ts`, make the sort take a direction (design §3):
  - rename `SortOrder.direction` to `defaultDirection`
  - export `SortDirection = 'asc' | 'desc'` and `SortState = { key, direction }`, plus
    `DEFAULT_SORT_STATE`
  - give `sortOwned(owned, key, direction = default)` a direction that negates only the primary
    comparison, leaving the name→identity tie-break ascending
  - add `nextSort(current, key)`: same key flips the direction, a new key takes its default

  Verify in `collection.spec.ts`:
  - each of the five keys reversed gives the primary order reversed
  - tied cards keep their relative order when reversed
  - name descending reads Z→A
  - `nextSort` flips on the same key and resets on a new one
  - existing two-argument calls still pass
- [ ] 2.2 Add `groupByRarity(sorted)`, returning `{ stars, start, entries }[]` (design §4). Verify
  with spec cases:
  - sections follow the input's direction
  - no empty sections
  - `start` equals the flat index of each section's first entry
  - concatenating the entries reproduces the input exactly

## 3. Reset in the user service

- [ ] 3.1 Add `UserService.reset()`, which sets the state to `seedUser()` and persists it
  (design §9). Verify in `src/services/user.service.spec.ts` with the in-memory store: after decks,
  grants, and Geo, `reset()` yields `geo 0`, the nine starter cards at quantity 1, and one empty
  deck. The store's last saved record equals `toPersisted(seedUser())`.

## 4. Shared confirmation dialog

- [ ] 4.1 Create `src/components/confirm-dialog/` (`.ts/.html/.css`, standalone) from the deck
  bar's `.confirm` markup and styles, following design §9:
  - inputs: `message`, `confirmLabel`, `cancelLabel`
  - outputs: `confirm`, `cancel`
  - `role="alertdialog"`, `aria-modal`, focus on cancel at open, Tab confined to the dialog, and
    Escape or a scrim click cancels
  - no transition under `prefers-reduced-motion`

  Verify with a Vitest component spec covering confirm/cancel emission and Escape.
- [ ] 4.2 Replace the deck bar's inline confirm with `<app-confirm-dialog>`, keeping the message
  `Delete Deck N? Its cards stay in your collection.` and the button labels `Delete Deck N` /
  `Keep it`. Verify that the existing e2e test "deleting a deck is confirmed, renumbers the rest,
  and costs no cards" passes unchanged apart from the tab→button selectors updated in 7.1.

## 5. Deck bar: buttons, centred row, disabled limit

- [ ] 5.1 In `deck-bar.html` / `.ts`, replace the tablist with plain `aria-pressed` buttons
  (design §6):
  - remove `role="tablist"`/`role="tab"`, `aria-selected`, the roving `tabindex`, `focusedTab`,
    `onTabKeydown`, `focusTab`, and the `.tab-mark` span
  - each deck becomes `<button class="deck-btn" [attr.aria-pressed] [attr.aria-label]="name">`
    inside `role="group" aria-label="Your decks"`
  - the visible label stays `Deck N` when selected and `N` otherwise

  Verify with `grep -n "tab-mark\|role=\"tab" src/components/deck-bar` returning nothing.
- [ ] 5.2 In `deck-bar.css`, restyle `.deck-btn` as a closed, bordered button: no
  `border-bottom-color: transparent`, all four corners at 2px radius. The selected state uses a
  filled `--color-surface` ground, a gold border, and weight 700. Delete the `.tab-mark` rules.
  Rebuild `.tab-row` as one centred, wrapping flex row with the separator and controls wrapped in a
  non-splitting `.deck-controls-unit` after the last button (design §7), and centre the icon
  tooltip under its button. Verify with a scratch Playwright screenshot
  (`e2e/scratch/deck-row.spec.ts`) at 1 deck, 5 decks, and 9 decks. The row should read as one
  centred group with the separator directly after the last deck button.
- [ ] 5.3 At `MAX_DECKS`, keep the + button rendered, following design §8:
  - `aria-disabled="true"` and the `.is-disabled` style
  - `data-tip="9 decks is the limit"` (from `MAX_DECKS`)
  - `aria-describedby` pointing at a visually hidden reason
  - a click guard

  Delete `.bar-note` and its markup. Verify with the updated e2e test in 7.3.

## 6. Collection page and grid

- [ ] 6.1 In `collection.ts`, hold the sort as `signal<SortState>` and add a `sortGeneration`
  signal. `onSort(key)` applies `nextSort`, bumps the generation, and closes the menu.
  `owned` uses `sortOwned(..., key, direction)`. Add `sections = computed(...)` that returns
  `groupByRarity(owned())` for rarity and one unlabelled section otherwise. Verify in
  `collection.spec.ts` (component): choosing the active key flips the direction, choosing a new key
  resets it, and `sections()` is multi-section only for rarity.
- [ ] 6.2 Render the chevron in `collection.html`: an inline SVG chevron inside the active
  `.sort-option` only, pointing down for `desc` and rotated for `asc`, `aria-hidden`. Add a visually
  hidden `, descending` / `, ascending` span inside the button, and keep `aria-pressed`. Verify
  with the e2e test in 7.4.
- [ ] 6.3 Replace the page-wide `canAdd`/`addReason` with a per-card `tiles` view-model
  `{ card, quantity, used, addReason }`. `used` is `copiesInDeck` on the selected deck, and
  `addReason` maps `addRefusal` to words (design §1–2). Feed the reader from the same entry.
  Verify in `collection.spec.ts`:
  - with one held copy already in Deck 1, that card's tile has
    `addReason === 'Every copy you hold is already in Deck 1.'`
  - switching to an empty Deck 2 clears it
  - the reader's `actionAvailable` matches the tile's
- [ ] 6.4 In `collection-grid`, swap the inputs and render the sections (design §4–5):
  - accept `sections` and `generation` instead of `owned`, `addAvailable`, and `addReason`
  - render a `<section>` with an `<h2 class="section-head">` (star glyphs `aria-hidden` plus
    `N stars` text) and its own `.grid` for each labelled section, and a bare `.grid` when there is
    a single unlabelled section
  - give each tile `data-index` = its flat index, and keep `--index` as the flat index for the
    stagger
  - track tiles by `generation + ':' + cardKey(card)`
  - the menu's `available`/`reason` come from the tile

  Update `Collection#restoreFocus` to query `[data-index="i"]`. Verify that
  `ng build` succeeds and the e2e tests in 7.5 and 7.6 pass.
- [ ] 6.5 Rework the badge (design §10):
  - with a deck selected: `<span class="used">u</span> / <span class="held">h</span>` and
    `aria-label="u of h in Deck N"`
  - when `used === held`: an `.is-exhausted` filled, inverted pill with a leading `✓`
  - with no deck selected: `×h`, labelled `h held`

  Keep the S–SE anchor. Verify with the e2e tests in 7.7, and with the existing badge-geometry
  test, which must still pass at 1/1 and at the widest figure a seeded collection reaches
  (`9 / 9`).
- [ ] 6.6 Add the reset control at the trailing end of `.sort-row`: a dashed-border
  `.bar-control.reset-data` with a `Debug` chip and the label `Reset data`. Activating it opens
  `<app-confirm-dialog>` with `Reset all data? Your cards, Geo, and decks will be replaced with a
  new player's.` and the buttons `Reset data` / `Cancel`. On confirm, `onReset()` does the
  following (design §9):
  - calls `users.reset()`
  - selects deck 0
  - restores `DEFAULT_SORT_STATE`
  - bumps the generation
  - closes the menu and the reader

  Verify that the `.sort-row` still fits on one line at the smallest supported viewport (the fit
  test in 7.8), and with the e2e test in 7.9.

## 7. Browser verification (`e2e/cards.spec.ts`, `e2e/helpers.ts`)

- [ ] 7.1 Update `helpers.ts#deckTabs` to select `app-deck-bar .deck-btn`. Replace every
  `getByRole('tab', …)` with `getByRole('button', { name: 'Deck N', exact: true })` and every
  `.is-selected` check with `aria-pressed="true"`. Verify that `grep -n "'tab'" e2e` is empty and
  `npm run e2e -- cards` passes these tests.
- [ ] 7.2 Fix the tests that assumed unlimited copies. Use `openCardsAs` to seed quantities, or add
  distinct starters:
  - "a deck is built, filled, trimmed, and survives a reload": fill with the nine distinct starters
  - "removing the second of three copies…": seed three copies
  - the standing test's repeated adds
  - any other loop that adds one tile more times than it is held

  Verify with a passing `npm run e2e -- cards`.
- [ ] 7.3 Rewrite "the create control is absent at the deck limit" as "the create control is
  disabled at the deck limit". At nine decks the `New deck` button is present with
  `aria-disabled="true"`, clicking it leaves nine buttons, focusing it shows the
  `9 decks is the limit` tooltip, and deleting one deck re-enables it. Replace "the selected tab is
  marked by more than colour" with a check that the selected button's computed `font-weight`
  and `background-color` differ from an unselected one's, and that no `.tab-mark` or diamond
  element exists. Extend "the deck controls are named icons, set apart from the tabs" with two
  checks: the separator's left edge is greater than the last deck button's right edge, and the
  row's centre is within 2px of the bar's centre at 1 and 5 decks.
- [ ] 7.4 Add "the active order shows its direction and reverses on a second choice". At arrival
  only `Rarity` holds a chevron and its name includes `descending`. Choosing `Attack` twice gives
  ascending attack order (read from the tiles), with the chevron rotated. Choosing `Name` then
  reads A→Z.
- [ ] 7.5 Add "ordering by rarity sections the collection". Seed cards of 1★, 2★, and 4★. Expect
  three `.section-head` elements reading `4 stars`, `2 stars`, `1 star(s)` in that order, each
  section holding only its rating. Reversing gives the reverse order. `Name` shows no section
  heads.
- [ ] 7.6 Add "a reorder animates every tile". After arrival settles, change the order and assert
  that every `.tile` reports a running `tileIn` animation (`el.getAnimations()`), including a tile
  whose position did not change. Extend the Cards case in `e2e/reduced-motion.spec.ts`: after a
  reorder under reduced motion, no tile has a running animation.
- [ ] 7.7 Add "the badge states used of held, per deck". Seed one card at quantity 3 and two
  decks. Add the card twice to Deck 1; the badge's accessible name is `2 of 3 in Deck 1`. Add a
  third time; the badge has `.is-exhausted` and a `✓`, and the menu withholds the add with
  `Every copy you hold is already in Deck 1.` Switch to Deck 2; the badge reads `0 of 3 in Deck 2`
  and the add is offered.
- [ ] 7.8 Run the existing "the Cards page fits the viewport" matrix with the reset control and the
  chevron present. Verify that no size scrolls the document and that `.sort-row` is a single line.
- [ ] 7.9 Add "reset restores a new player after confirmation":
  - seed several decks, extra cards, and Geo
  - activate `Reset data`, then cancel; nothing changes
  - activate it again and confirm; one deck, nine tiles, `0` in the nav purse, rarity descending
  - reload; the state is still the seeded one

## 8. Wrap-up

- [ ] 8.1 Run `ng test`, `ng build`, and `npm run e2e`. All three pass. Run Prettier on the
  changed files. Run `openspec validate refine-cards-screen-decks-and-sorting --strict`; it
  reports valid.
