## 1. Deck standing in the model

- [ ] 1.1 In `src/model/deck.ts`, declare `RARITY_LIMIT = { minStars: 4, allowed: 1 }` beside
  `DECK_SIZE` and `MAX_DECKS`, with a comment saying why the threshold is "four or more" (design §1).
  Verify that `grep -rn "minStars: 4\|>= 4" src/model` finds it only there.
- [ ] 1.2 Add the `DeckProblem` / `DeckStanding` types and a pure `deckStanding(deck)` that returns
  the problems with Invalid ranked first. A key that resolves to no catalogue card does not count
  toward rarity but does count toward size. Verify with new cases in `src/model/deck.spec.ts`, which
  must pass under `ng test`:
  - a full deck within the limit is Ready
  - 5 cards needs 4 more
  - an empty deck needs 9
  - two different 4★ cards is Invalid with `held: 2, allowed: 1`
  - two copies of one 4★ card is Invalid
  - a 4★ plus a 5★ or 6★ is Invalid (built with an in-test `Card`)
  - nine cards of 3★ or less is not Invalid
  - 6 cards with two 4★ reports both problems, Invalid first
  - evaluating the same deck twice gives equal results
- [ ] 1.3 Add `isBattleReady(deck)` that reads only `deckStanding(deck)`. Verify with spec cases:
  Ready is eligible, an Invalid-only deck is not, an Incomplete-only deck is not, both problems is
  not, and a freshly seeded user's deck is not eligible.
- [ ] 1.4 Confirm that `addCardToDeck` accepts a second 4★ card into a deck with room. Add a spec
  case that also asserts the resulting standing is Invalid, and a removal case that asserts it
  becomes valid again. Verify that the persisted user shape is unchanged: the existing
  `src/services/user-store.spec.ts` round-trip tests pass, and none of them sees a standing field.

## 2. Status colour tokens

- [ ] 2.1 Add `--color-warning` (a yellow visibly apart from `--color-gold`) and `--color-error`
  (a red with its own value, not `var(--color-crimson)`) to the `@theme` block in
  `src/styles/tokens.css`, with a comment on each giving its role. Verify that both appear as
  labelled swatches on `/style-guide` without editing the guide, and that both are legible as text
  on the ground. Check this with a scratch Playwright screenshot under `e2e/scratch/`.

## 3. Single-line screen header primitive

- [ ] 3.1 Add `.screen-header`, `.screen-header-title`, and `.screen-header-rule` to
  `src/styles/primitives.css`:
  - the rules are `flex: 1 1 0; min-width: 0`, a gradient line ending in a node diamond, and
    mirrored on the end rule
  - the title is `flex: none; white-space: nowrap`, in the display font with the soul colour and
    glow (moved from `collection.css` `.page-title`)
  - the vertical padding is small
  - there is no eyebrow or tagline slot

  Verify with `ng build`.
- [ ] 3.2 Replace the Cards page's `.page-head` markup in `src/components/collection/collection.html`
  with the primitive (`<h1 class="screen-header-title">Cards</h1>` between two `aria-hidden` rules),
  and delete `.page-head`, `.page-title`, and `.page-head .ornament` from `collection.css`. Verify
  that `grep -n "page-head\|page-title" src/components/collection` returns nothing.
- [ ] 3.3 Add a "Screen header" section to `src/components/style-guide/style-guide.html` with:
  - a full-width example, using an `<h2>` title so the guide keeps its own `<h1>`
  - the same example inside a narrow (~200px) container

  Verify on `/style-guide` that both render on one line and that the narrow one has shorter rules.

## 4. Deck bar: tabs, controls, standing

- [ ] 4.1 Tabs in `src/components/deck-bar/`: render `Deck N` on the selected tab and the numeral
  alone on every other tab, with `aria-label` set to the full `Deck N` on every tab, a `min-width`
  on tabs, and the existing `.tab-mark` kept. Verify by hand that keyboard arrow navigation still
  moves the selection and the full label follows it.
- [ ] 4.2 Restructure `.tab-row` into the tab strip followed by a `.deck-controls` group: a visible
  1px vertical separator, a wider gap, and the group pinned to the row's end. Move the
  `bar-note` "9 decks is the limit" into the group. Verify that the group stays at the end of the row
  as decks go from 1 to 9.
- [ ] 4.3 Replace the `+ New deck` and `Delete Deck N` text buttons with inline-SVG + and trash-can
  icon buttons (`aria-hidden` SVG, `currentColor`). Each gets `aria-label` and `data-tip` set to
  "New deck" / "Delete Deck N", plus a CSS `::after` tooltip shown on `:hover` and `:focus-visible`
  that appears without a fade under reduced motion. Keep the delete button's crimson hover and the
  confirm dialog's text buttons. Verify the tooltips by hovering and by tabbing.
- [ ] 4.4 Replace `.deck-count` with a `.deck-standing` `aria-live="polite"` list built from
  `deckStanding` of the selected deck, with one item per problem and Invalid first:
  - **Error item:** a filled-diamond mark, the leading word "Invalid", the rule broken, and how many
    to remove. It uses `--color-error` text, a left rule, and a faint tint.
  - **Warning item:** an outlined-triangle mark, the leading word "Incomplete", and how many more
    cards are needed from the collection below. It uses `--color-warning` text with no rule or tint.
  - **Ready:** a single muted "Ready for battle" line.

  Remove `filledCount`, `isFull`, and the "positions filled" / "empty" / "full" notes from the deck
  bar, leaving the collection's `addReason` "Deck N is full." untouched. Verify that
  `grep -rn "positions filled" src` returns nothing.

## 5. Browser verification

- [ ] 5.1 Update `e2e/helpers.ts`:
  - remove `filledCount`
  - add a `deckStanding(page)` helper returning the kind and text of each `.deck-standing` item
  - add `deckControls(page)` for the + and trash buttons by accessible name

  Then update every `filledCount` call site in `e2e/cards.spec.ts` to assert `deckCards(page)`
  counts and the standing instead. Rename the `'+ New deck'` role queries in `e2e/cards.spec.ts` and
  `e2e/reduced-motion.spec.ts` to `'New deck'`, and drop `count` from `pinnedParts` in favour of the
  standing. Verify that `npm run e2e` passes.
- [ ] 5.2 Add e2e coverage to `e2e/cards.spec.ts` for the tabs:
  - with three decks and the first selected, the visible tab text reads `Deck 1`, `2`, `3`
  - after choosing the second tab, it reads `1`, `Deck 2`, `3`
  - every tab's accessible name is `Deck N` throughout

  Verify with `npm run e2e -- cards`.
- [ ] 5.3 Add e2e coverage for the controls:
  - both icon buttons are found by their accessible names and show no text on their face
  - a tooltip is visible on hover and on keyboard focus
  - a separator element sits between the last tab and the first control, and the horizontal gap
    from the last tab's right edge to the first control's left edge exceeds the gap between tabs
  - at the deck limit, the + is absent and the limit note sits inside `.deck-controls`

  Verify with `npm run e2e -- cards`.
- [ ] 5.4 Add e2e coverage for the standing:
  - the seeded empty deck warns that 9 are needed, and no error is shown
  - after adding 4★ cards twice (two copies of a 4★ the seed holds, or a user persisted with one
    if the seed holds none), the error appears without a reload, ranked before the warning
  - the computed colour of the error item equals `--color-error`, the warning's equals
    `--color-warning`, and the two differ
  - after removing one 4★ card, the error is gone
  - a full deck within the limit shows "Ready for battle"
  - no text matching `/positions filled/i` appears anywhere on the page

  Verify with `npm run e2e -- cards`.
- [ ] 5.5 Add e2e coverage that the header is the shared primitive and occupies one line at every
  size in the existing "fits the viewport" ladder: `.screen-header` height ≤ title line-height plus
  padding, the title's `getClientRects().length === 1`, and the page has exactly one `h1` reading
  `Cards`. Write review screenshots of the pinned region to `test-results/` at the narrowest and
  widest sizes. Verify with `npm run e2e -- cards`.
- [ ] 5.6 Run `ng test`, `npm run e2e`, and `ng build` and confirm all three pass. Then look at the
  pinned-region screenshots from 5.5 and confirm the warning reads softer than the error, and that
  the controls read as apart from the tabs.
