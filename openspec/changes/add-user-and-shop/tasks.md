## 1. Card identity and the catalogue index

- [ ] 1.1 In `src/model/card.ts`, add the `CardKey` type (`` `${string}#${number}` ``), `cardKeyOf(set, number)`, and `cardKey(card)`. Verify unit tests assert `cardKey` on the Crawlid entry returns `FC#1` and that `cardKeyOf('FC', 1)` returns the same string.
- [ ] 1.2 Build `CARD_BY_KEY: ReadonlyMap<CardKey, Card>` once from `CARD_DB` and fold the existing set+number uniqueness assertion into that build, so a collision is a duplicate key rather than a separate pass. Verify a unit test asserts the map holds 15 entries, that `CARD_BY_KEY.get('FC#7')` is Vengefly, and that building an index over a two-card array sharing a set and number throws.

## 2. The user model

- [ ] 2.1 Create `src/model/user.ts` with `UserState { geo: number; collection: ReadonlyMap<CardKey, number> }` and the pure helpers `quantityOf(collection, card)`, `grantAll(collection, cards)`, `totalCards(collection)`, and `distinctCards(collection)`. Verify unit tests assert an unowned card reports 0, that granting a held card raises its quantity to 2 without changing the distinct count, and that three copies of one card plus one of another report 2 distinct and 4 total.
- [ ] 2.2 Add `STARTER_CARD_KEYS` as an explicit frozen list of the nine keys named in `design.md`, with a module-level assertion that it holds exactly nine and that every key resolves in `CARD_BY_KEY`. Verify a unit test asserts the list is length 9, that every entry resolves to a real card, and that every one of those cards is one-star.
- [ ] 2.3 Add `seedUser(): UserState` returning zero Geo and one copy of each starter card. Verify unit tests assert a seeded user has `geo === 0`, 9 total cards, 9 distinct cards, and that two independent calls produce equal collections.
- [ ] 2.4 Confirm `grantAll` never mutates its input collection — it returns a new map. Verify a unit test grants against a collection and asserts the original map's size and quantities are unchanged.

## 3. The user service

- [ ] 3.1 Create `src/services/user.service.ts` as a root-provided service in the shape of `game.service.ts`: a private `signal<UserState>`, a readonly projection, and `computed` `geo`, `collection`, `totalCards`, `distinctCards`. Verify a unit test reads a freshly constructed service and finds the seeded starter state.
- [ ] 3.2 Implement `creditGeo(amount)` and `grantCards(cards)`. Verify unit tests assert crediting 500 raises the balance by exactly 500, that crediting zero or a negative amount is rejected without changing the balance, and that granting five cards raises the total by 5.
- [ ] 3.3 Implement `purchase(price, cards): boolean` applying the deduction and the grant in a single `_state.update()`. Verify unit tests assert: a purchase at exactly the balance succeeds and leaves 0; a purchase one Geo over the balance returns false and changes neither balance nor collection; and a signal effect observing the state records exactly one emission per successful purchase, never an intermediate one.
- [ ] 3.4 Confirm no public method can lower the balance without granting cards — there is no bare `spendGeo` on the service's surface. Verify a unit test asserts the service exposes no such method and that an arbitrary sequence of credits and purchases never leaves the balance negative.

## 4. Persistence

- [ ] 4.1 Create `src/services/user-store.ts` with the `UserStore` port (`load(): Promise<PersistedUser | null>`, `save(user): Promise<void>`), the `PersistedUser` envelope type, the `SCHEMA_VERSION` constant, and an injection token defaulting to the `localStorage` implementation. Verify the file compiles and a unit test substitutes an in-memory store through the token with a single `providers` entry.
- [ ] 4.2 Implement `toPersisted(state)` and `parsePersistedUser(raw)` in `user.ts`: serialize to the versioned envelope with a `{ set, number, quantity }` entry array, and parse back returning `null` rather than throwing. Verify a unit test round-trips a user with duplicates and asserts the restored state equals the original, and that the serialized JSON contains no card name, artwork, stat, arrow, or ability text.
- [ ] 4.3 Make `parsePersistedUser` reject a bad envelope and drop bad entries individually: a missing, newer, or non-numeric `version`, a non-object root, or a non-integer or negative `geo` returns `null`; an entry with a negative, fractional, or non-numeric quantity is dropped; an entry whose key misses in `CARD_BY_KEY` is dropped. Verify unit tests cover each case and assert that a record with five known cards, one unknown card, and a balance restores the five and the full balance.
- [ ] 4.4 Implement `LocalStorageUserStore` against one named storage key, with `load` and `save` both surviving a store that throws on read or write. Verify unit tests using a stubbed store that throws assert `load` resolves to `null` and `save` resolves without rejecting.
- [ ] 4.5 Wire loading into `UserService.load()` — resolve the store, parse it, and set either the restored user or a fresh seed — and register it in `src/app/app.config.ts` via `provideAppInitializer`. Verify a unit test asserts the service holds restored state after `load()` against a populated in-memory store and a seeded user against an empty one, and that `ng build` succeeds.
- [ ] 4.6 Make every mutation write through to the store, fire-and-forget, ignoring both resolution and rejection. Verify a unit test asserts a `save` is issued after each of `creditGeo`, `grantCards`, and a successful `purchase`, that no save is issued for a failed purchase, and that a store whose `save` rejects leaves the in-memory state correct and raises no unhandled rejection.

## 5. Pack composition

- [ ] 5.1 Create `src/model/pack.ts` with `Rarity`, `RarityWeights`, `PackDefinition`, and `PACKS` — the three tiers with the names, prices, and weight tables stated in `design.md`. Verify unit tests assert exactly three tiers named Level 1/2/3, prices 100/250/500 strictly ascending, a weight stated for all six rarities in each tier, and every weight greater than zero.
- [ ] 5.2 Add unit tests for the ladder the spec requires: expected rarity strictly increases across the tiers (1.67 / 2.44 / 3.56), the chance of ★4 or better strictly increases (4% / 21% / 53%), the chance of ★1 strictly decreases, and each rarity's weight is monotone across the three tiers in one direction. Verify these are computed from `PACKS` rather than hardcoded, so a future tuning edit fails the test that it breaks.
- [ ] 5.3 Implement `drawPack(def, catalogue, rng = Math.random): Card[]` as described in `design.md` — group by rarity, sum the weights of represented rarities only, pick a rarity against that sum, then pick uniformly among that rarity's cards. Verify unit tests assert exactly five cards from every tier, five cards from a catalogue of one card, and that a scripted RNG yields identical packs on two runs.
- [ ] 5.4 Verify renormalization: a unit test draws a large sample of each tier against the real `CARD_DB` and asserts no ★5 or ★6 appears and the observed ★1–★4 split converges on the effective distributions tabled in `design.md`; a second draws against an all-one-star catalogue and asserts five one-star cards; a third asserts the declared `PACKS` weights are unchanged after a renormalizing draw.
- [ ] 5.5 Verify the draws are independent: a unit test over a large sample asserts packs containing the same card twice occur, that packs of five identical rarities occur for Level 1, and that the rarity distribution of the fifth card matches that of the first.
- [ ] 5.6 Implement `revealOrder(cards): Card[]` sorting ascending by stars with a stable tie-break. Verify unit tests assert a pack of rarities 3,1,4,1,2 comes back as 1,1,2,3,4; that two distinct cards of the same rarity keep their draw order; and that an all-one-rarity pack is returned in draw order.

## 6. The pack-opening component

- [ ] 6.1 Scaffold `src/components/pack-opening/` as a standalone component taking `cards: Card[]` and emitting `done`, rendering every card through `app-card`. Verify it renders five card faces when handed five cards.
- [ ] 6.2 Build the layout: a hero slot laid out above the card renderer's 200px ability gate, a collected row beneath it floored at the card's 120px minimum, and a single uniform `transform: scale()` on the overlay when the viewport cannot host it. Verify in the browser at 1440×900 that the hero card shows its ability text, set, and number, and that at a viewport too small the whole overlay scales rather than clipping or re-laying out.
- [ ] 6.3 Drive the sequence from `revealedCount = signal(0)` advanced by a timer chain, with CSS keyed off each card's position relative to that count. Verify in the browser that the five cards become visible one after another and that each revealed card comes to rest in the collected row in order.
- [ ] 6.4 Scale dwell time and arrival flourish with the card's star rating, using the existing `--dur-*`, gold, and soul glow tokens. Verify a ★4 card visibly holds longer and arrives with stronger emphasis than a ★1, and that a repo search finds no hardcoded duration or glow colour in the component's CSS.
- [ ] 6.5 Carry rarity emphasis as a rarity-keyed class on each card's wrapper — glow and label — rather than as an animation, so it survives motion being removed. Verify a unit test asserts the class reflects the card's stars, and that with animations disabled the emphasis is still present in the rendered markup and styles.
- [ ] 6.6 Add the skip control, and make reduced motion and component destruction take the same route — set `revealedCount` to 5 and clear pending timers. Verify skipping partway shows all five immediately in the same order; that a `@media (prefers-reduced-motion: reduce)` block also zeroes the animations; and that destroying the component mid-sequence leaves no timer running.
- [ ] 6.7 Add the end state: all five cards visible together with a control that emits `done`. Verify activating it emits exactly once and that the control is reachable by keyboard.

## 7. The Shop storefront

- [ ] 7.1 Rewrite `src/components/shop/shop.html` and `shop.css`, keeping the void background, particle field, and ornament vocabulary, and replacing the "Coming soon" block with the storefront regions: purse, pack wares, dev grant, and the power-up and cosmetic placeholders. Verify the page still renders its themed treatment and no longer presents itself as a placeholder.
- [ ] 7.2 Render the Geo purse from `UserService.geo`, named as Geo, using the gold ramp. Verify a new player sees 0 rather than a blank, and that the displayed value updates without a reload after a grant.
- [ ] 7.3 Render the three pack wares from `PACKS` in ascending price order, each naming itself, its price, that it holds five cards, and the character of its odds. Verify all three render, that the order follows price, and that the odds text distinguishes the tiers.
- [ ] 7.4 Mark a pack whose price exceeds the balance as unaffordable and make it inert to pointer and keyboard. Verify with 0 Geo that all three are marked and none can be activated; with 100 Geo that Level 1 is buyable and Level 3 is marked; and that raising the balance makes a pack buyable without a reload.
- [ ] 7.5 Wire the buy action: draw the pack, call `UserService.purchase(price, cards)`, and open the overlay only on success with `revealOrder` applied to the drawn cards. Verify the balance falls by exactly the price, the collection grows by five, the revealed cards are the granted cards, and a failed purchase opens nothing.
- [ ] 7.6 Add the dev-grant control, crediting 500 Geo and plainly labelled as a temporary development aid. Verify the label states what it is, the purse rises on use, and that the page presents no real-money purchase, currency bundle, or reward claim.
- [ ] 7.7 Add the power-up and cosmetic placeholders, marked as forthcoming, presenting no price and no purchasable item, and inert on activation. Verify activating one spends nothing and opens nothing.
- [ ] 7.8 Style prices, the purse, and the grant from the gold ramp with no new token added to `src/styles/tokens.css`. Verify a diff of `tokens.css` is empty.

## 8. Browser verification

- [ ] 8.1 Add a Playwright spec covering the storefront: the Shop renders the purse, all three packs in price order, and both placeholders; with 0 Geo every pack is inert; after the dev grant the purse rises and Level 1 becomes buyable. Verify `npm run e2e` passes.
- [ ] 8.2 Extend it to the opening: buying a pack reveals five cards one at a time, each revealed card's rarity is greater than or equal to the one before it, the hero card's ability text is legible, and closing returns to the storefront with the purse decremented.
- [ ] 8.3 Verify persistence in the browser: buy a pack, reload the page, and assert the purse and the collection size still reflect the purchase.
- [ ] 8.4 Add the Shop and the overlay to the reduced-motion coverage in the existing `reduced-motion` project: buying a pack under the preference presents the five cards in the same common-to-rare order without animated arrival, with rarity emphasis still discernible.
- [ ] 8.5 Verify the fit: the Shop page and an open overlay produce no scrollbar and clip nothing at 1920×1080, 1440×900, and 1366×768, using the existing `expectNoScroll` and `expectNothingClipped` helpers.
- [ ] 8.6 Capture review screenshots to `test-results/` of the storefront, a mid-reveal hero card, and the five-card summary, for a person to look at.

## 9. Close-out

- [ ] 9.1 Run `ng test` and confirm the whole Vitest suite passes, including the existing card, game, scoreboard, and guard specs.
- [ ] 9.2 Run `ng build` and confirm a clean production build with no new dependency in `package.json`.
- [ ] 9.3 Run Prettier over the changed files and confirm formatting matches the repo's 100-char, single-quote, `angular`-HTML-parser settings.
- [ ] 9.4 Verify the change against its specs end to end: every requirement in `user/data-model`, `user/persistence`, `cards/packs`, and the `shop` delta has a passing Vitest or Playwright check, and the removed Shop placeholder requirement no longer describes the page.
