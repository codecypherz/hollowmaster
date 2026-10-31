## 1. Rename the Cards page to Decks (its own commit)

- [ ] 1.1 `git mv src/components/collection src/components/decks`. Rename the files to `decks.*`,
      the class to `Decks`, and the selector to `app-decks`. Update the imports in the moved
      component and its `.spec.ts` (`collection-grid`'s `import type { Tile, TileSection }` path
      included). Verify with `ng build` and `ng test`, both green.
- [ ] 1.2 Set the screen header title to `Decks`. Replace "Cards page" in the doc comments of
      `decks.ts`, `deck-bar.ts`, `confirm-dialog.ts`, `card-reader.ts`, `fit.ts`, and `user.ts`,
      and in the Vitest `describe` names. Verify that `grep -rn "Cards page" src` returns nothing.
- [ ] 1.3 In `src/app/app.routes.ts`, serve `Decks` lazily at `decks` and add
      `{ path: 'cards', redirectTo: 'decks' }`. In `nav-shell.html`, link to `/decks` with the
      label `Decks`. Verify `ng build`.
- [ ] 1.4 In `e2e/helpers.ts`, rename `openCards`→`openDecks` and `openCardsAs`→`openDecksAs` and
      point them at `/decks`. Rename `e2e/cards.spec.ts` to `e2e/decks.spec.ts`, and update the
      callers in `reduced-motion.spec.ts`, the `Cards` labels in `smoke.spec.ts`, and the
      screenshot names. Add a smoke check that `/cards` lands on `/decks` with the Decks nav item
      active. Verify with `npm run e2e`, all green.
- [ ] 1.5 Commit the rename on its own before any Collection-page work. Verify that `git log
      --stat -1` shows the files as renames.

## 2. Model: named sets, prices, Rosaries, and trimming

- [ ] 2.1 In `src/model/card.ts`, add `CARD_SETS` (FC Forgotten Crossroads, GP Greenpath, CT City
      of Tears), a module-load assertion (unique ids and names, every `CARD_DB` card's set listed),
      and `cardsInSet(id)` sorted by number. Verify with Vitest cases in `card.spec.ts`: lookup,
      order, an unlisted set rejected, and an empty set allowed.
- [ ] 2.2 Add `rosaries` to `UserState` and set `seedUser()` to 0. Move persistence to
      `SCHEMA_VERSION = 3` with `rosaries` in `PersistedUser`. Accept v1 (no decks, 0 Rosaries),
      v2 (0 Rosaries), and v3 (a negative, fractional, or non-number `rosaries` rejects the record).
      Verify with `user.spec.ts` and `user-store.spec.ts` cases for each version plus the round
      trip.
- [ ] 2.3 Add `trimDecks(decks, key, quantity)` to `src/model/deck.ts`. It drops the latest
      excess copies per deck, keeps the remaining cards in order, and returns the same deck object
      when nothing changes. Verify with `deck.spec.ts` cases from the `user/decks` scenarios: the
      only copy leaves every deck, the latest copy is removed, a deck within the quantity is
      untouched, and the trimmed full deck's standing becomes incomplete.
- [ ] 2.4 Create `src/model/exchange.ts` with `ROSARY_PRICE_PER_STAR`, `salePrice`,
      `purchasePrice`, `buyCard`, `sellCard` (using `trimDecks`), and `decksTrimmedBySale`. Verify
      with `exchange.spec.ts`: prices for 1★ and 4★, sale below purchase for every catalogued card,
      an exact-balance buy, an unaffordable buy that changes nothing, a sale of a card not held
      that is refused, a sale that leaves Geo unchanged, and `decksTrimmedBySale` equal to the
      decks `sellCard` actually changes.
- [ ] 2.5 Add a `rosaries` computed signal, `buyCard(card)`, and `sellCard(card)` to `UserService`
      through `apply`. Verify with `user.service.spec.ts`: each persists once on success and not
      at all on refusal, `reset()` zeroes Rosaries, and a v2 record loads with 0 Rosaries and is
      rewritten at v3.

## 3. Rosary amount primitive

- [ ] 3.1 Commit `public/images/rosarie.webp`. Create `src/components/rosary/` (`app-rosary`,
      host class `rosary-amount`, value span plus `<img class="rosary-mark" alt="Rosaries">`).
      Extend the Geo selectors in `src/styles/primitives.css` to cover
      `.rosary-amount`/`.rosary-mark` rather than copying the rules. Verify with a Vitest component
      test that the numeral comes first and the mark's alt is `Rosaries`.
- [ ] 3.2 Add the Rosary amount to the style guide's primitive section: 0, 10, 600, at two type
      sizes, inside an enabled and a disabled button, and beside a Geo amount. Verify by viewing
      `/style-guide` with a scratch Playwright screenshot in `test-results/`.

## 4. Collection page

- [ ] 4.1 Create `src/components/collection/` (`Collection`, `app-collection`) with the
      atmosphere layers, no `.corner` elements, and the two-row layout: a pinned top bar (single-
      line header `Collection` plus the Rosary purse in the right column) and the scrolling
      sections region. Serve it lazily at `collection`, and add the fourth nav item after Decks.
      Verify with `ng build`, and that `/collection` renders with the nav order Shop, Battle,
      Decks, Collection.
- [ ] 4.2 Render one section per `CARD_SETS` entry. Each has a left-aligned heading with the set
      name and `held / total` progress (accessible "N of M collected"). Empty sets are marked
      forthcoming with no tiles. Tiles appear in set-number order at the fixed 150px track. Verify
      with a component test of the sections, progress, distinct-not-copies counting, and the
      forthcoming GP and CT sections.
- [ ] 4.3 Tile overlays: the `N held` badge for owned cards, and the void veil plus `Not owned`
      badge for unowned cards. Neither overlay covers the name, stars, stat bars, or chevrons.
      Verify with a component test of the badge text and accessible names.
- [ ] 4.4 Buy control: `Buy <app-rosary>` with the accessible name "Buy {card} for {price}
      Rosaries". When unaffordable, use `aria-disabled` with the tooltip and description "Not
      enough Rosaries" and make activation inert. Verify with a component test of buy success, an
      unaffordable no-op, and the control becoming available when the balance rises.
- [ ] 4.5 Sell control: `Sell <app-rosary>`, only for held cards, with a non-focusable spacer
      holding its slot otherwise. Add the trim warning glyph with the tooltip and description
      naming the decks from `decksTrimmedBySale`. Verify with a component test: the warning names
      Deck 1 and Deck 3, there is no warning when copies remain, and the sale trims those decks.
- [ ] 4.6 Add the polite live-region announcement after each exchange, with focus kept on the
      activated control or moved to the tile's Buy control when Sell disappears. Verify with a
      component test of the announcement text (including the trimmed decks) and
      `document.activeElement`.

## 5. Browser verification

- [ ] 5.1 Add `e2e/collection.spec.ts`. It checks that the page doesn't scroll and only the
      sections region does, at a large desktop and a small laptop viewport. It checks that no
      `.corner` elements exist and the atmosphere is present, that the purse's box is in the top-
      right and doesn't intersect the title, that every tile card's width is between the
      renderer's minimum width and the ability gate, and that the badges don't overlap the name,
      stars, stat bars, or chevrons. It covers a buy/sell round trip that updates the purse,
      counts, and progress without a reload and survives one. It checks that selling the last copy
      used by a deck removes it on the Decks page, and that the Decks page's reset zeroes the
      purse. It saves screenshots of a six-star-priced tile and of the four-item nav at the
      narrowest viewport to `test-results/`. Verify with `npm run e2e -- collection`, green.
- [ ] 5.2 Extend `e2e/reduced-motion.spec.ts` with the Collection page: tiles and the purse appear
      without animation, and the owned and unowned, warning, and unavailable treatments are still
      present. Verify with `npm run e2e`, all green.
- [ ] 5.3 Review the screenshots from 5.1. If the price buttons overflow the 150px tile, stack them.
      If the nav wraps, step its buttons down a primitive size. Verify by re-running `npm run e2e`
      and re-checking the screenshots.

## 6. Wrap-up

- [ ] 6.1 Run `ng test`, `ng build`, `npm run e2e`, and Prettier on the changed files. All pass.
- [ ] 6.2 After archive, rewrite the Purpose of `openspec/specs/collection/spec.md` to describe
      the Collection page, and update `CLAUDE.md` and the memory notes if they mention the Cards
      page. Verify that `openspec validate --specs --strict` passes.
