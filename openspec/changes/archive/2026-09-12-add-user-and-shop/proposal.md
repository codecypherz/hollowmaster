## Why

Hollow Master has cards, a board, and a match — but nothing that belongs to the player. `CARD_DB`
is dealt directly into both hands by `GameService.startGame()`, so every match is played with the
same fifteen cards regardless of what the player has done before, and there is no reason to open a
pack because there is nothing for a pack to go into. The Shop and Cards pages are honest
placeholders that say as much: `openspec/specs/shop/spec.md` currently *forbids* the Shop from
presenting purchasable packs, prices, or a currency balance, because none of those things exist.

This change introduces the thing the game is missing: a **user** who owns a collection of cards and
an amount of **Geo**, and a **Shop** that turns Geo into cards. It is the first half of the
progression loop — the half that can be built and played with entirely in the browser, before any
question of accounts or servers has to be answered.

## What Changes

**A user record.** A single local player with two things: a card collection and a Geo balance.

- The collection is a **multiset** — each catalogued card is held with a quantity, so a duplicate
  drawn from a pack is a visible gain rather than a silent no-op. With fifteen cards in `CARD_DB`
  and five cards to a pack, duplicates are the common case, not the edge case.
- The collection is **seeded with nine starter cards** — the nine one-star cards of set `FC`
  (Crawlid, Vengefly, Gruzzer, Tiktik, Aspid Hatchling, Wandering Husk, Husk Hornhead, Leaping
  Husk, Husk Bully), one copy each. Nine is `HAND_SIZE`: a new player owns exactly enough cards to
  field a hand, and every one of them is the weakest rarity, so the Shop has somewhere to go.
- The balance **starts at zero Geo** and can never go negative. Geo is spent atomically: a purchase
  that cannot be afforded changes nothing.
- **No sign-in, no name, no identity.** There is one user and the application does not ask who they
  are. The shape is designed so that adding those later is additive.

**Persistence behind a swappable port.** The user record survives a page refresh through a named
storage port with a `localStorage` implementation. The service depends on the port, never on
`localStorage` directly, so the backend implementation this eventually wants is a second adapter
rather than a rewrite. The serialized form stores **card identities (`set` + `number`), not card
objects**, and carries a schema version; unreadable, unversioned, or corrupt stored data falls back
to a fresh seeded user rather than throwing.

**Pack composition as data.** Three pack tiers — **Level 1**, **Level 2**, **Level 3** — each
costing Geo and each yielding **five cards**. Every pack can yield every card; the tiers differ
only in the *weight* given to each rarity. Rarity is the card's existing 1–6 star rating — no new
field is introduced. The weights are a declared table, stated in full in `design.md`, with the
lower tiers leaning common and Level 3 leaning rare.

Two consequences the table has to answer for, because `CARD_DB` holds no five-star or six-star
cards today:

- A weight for a rarity the catalogue cannot fill is **renormalized away** at draw time, so a draw
  never fails and never silently substitutes.
- The five draws in a pack are **independent** — a pack may contain the same card twice.

**A real Shop screen.** The placeholder is replaced by a storefront:

- The player's Geo purse, always visible.
- The three pack tiers presented as buyable wares, each naming its price and the character of its
  odds, and each visibly unaffordable when the purse is short.
- **An animated opening.** Buying a pack spends the Geo, draws the five cards, and plays a reveal
  in which the cards appear **one at a time, ordered from most common to most rare**, so the pack
  builds toward its best card rather than spoiling it first. The cards render through the existing
  `app-card` component at a width above its 200px ability gate. The whole sequence yields to
  `prefers-reduced-motion` and can be skipped.
- **A temporary, clearly-labelled Geo grant**, so the pack experience is exercisable while nothing
  in the game yet pays out. It is marked as a development aid on the screen itself and is not
  presented as a game mechanic.
- **Honest placeholders for power-ups and cosmetics**, marked as forthcoming in the way the current
  Shop page marks its whole self — they present no prices and no purchasable items.

**Not in scope:** sign-in, accounts, a user name, or any server; a real backend adapter for the
storage port; earning Geo from matches or any other gameplay reward; the Cards page rendering the
real collection (it keeps its placeholder); deck building; playing a match from the owned collection
rather than from `CARD_DB`; adding cards to `CARD_DB`, including the five- and six-star cards the
weight tables anticipate; and power-up or cosmetic behaviour beyond the placeholder.

## Capabilities

### New Capabilities

- `user/data-model`: What a user is — the card collection as a quantity-per-card multiset, the Geo
  balance and its non-negative invariant, the nine-card starter seed, and the operations that
  change either (grant cards, credit Geo, spend Geo atomically). Nothing today describes player-owned
  state of any kind.
- `user/persistence`: That the user record outlives a page load, through a storage port the
  application depends on rather than a concrete store — the serialized shape keyed by card identity,
  its schema version, when it is written, and what happens to data that cannot be read back.
  Separated from `user/data-model` so the eventual backend changes only this capability.
- `cards/packs`: What a pack of cards is — the three tiers, their prices, their per-rarity weight
  tables, the guarantee that every pack can yield every card, how a draw behaves when the catalogue
  cannot fill a rarity, and the order a pack's contents are revealed in. Sits beside
  `cards/data-model` because pack composition is card-domain logic, independent of the screen that
  sells it.

### Modified Capabilities

- `shop`: The existing spec establishes the Shop as a themed placeholder and explicitly requires
  that it "does not present purchasable packs, prices, or a currency balance as though they were
  functional". This change makes all three functional, so those requirements are removed and
  replaced by the storefront: the Geo purse, the three pack wares and their affordability states,
  the purchase transaction, the animated one-at-a-time reveal and its reduced-motion and skip
  behaviour, the temporary Geo grant, and the power-up/cosmetic placeholders that remain honest
  under the old rule.

## Impact

- **`src/model/user.ts`** (new) — the `UserState` shape, the `CardId` (`set` + `number`) identity
  used as the collection key, the starter seed constant, and pure functions over a collection.
- **`src/model/pack.ts`** (new) — the three `PackDefinition`s (id, display name, price, rarity
  weights), the weight tables, the draw that turns a definition plus a catalogue into five cards,
  and the reveal ordering. Pure and seedable so the odds are unit-testable without a browser.
- **`src/services/user.service.ts`** (new) — signal-backed user state in the shape of
  `GameService`: a private `signal`, a readonly projection, `computed` derivations for the balance
  and collection size, and the purchase action that spends Geo and grants cards in one step.
- **`src/services/user-store.ts`** (new) — the storage port interface and its `localStorage`
  implementation, injected so tests can substitute an in-memory store.
- **`src/model/card.ts`** — unchanged in shape. A lookup from `CardId` back to a `Card` is needed
  for deserialization; whether it lives here or in `user.ts` is a `design.md` decision.
- **`src/components/shop/shop.{ts,html,css}`** — rewritten from the placeholder into the storefront.
  It keeps the page's void background, particle field, and ornament vocabulary.
- **`src/components/pack-opening/`** (new) — the reveal sequence, so the Shop component stays a
  storefront and the choreography is testable on its own.
- **`src/styles/tokens.css`** — may gain a Geo/currency accent role if the palette has no fitting
  one; no new token category is expected.
- **Tests** — Vitest for the collection multiset, the Geo invariant, the starter seed, the storage
  round-trip and its corrupt-data fallback, the weight tables (shape, sum, and monotonicity across
  tiers), renormalization over a catalogue missing a rarity, and the common-to-rare reveal order.
  Playwright for what only a browser settles: the reveal renders five cards one at a time in
  ascending rarity, the purse decrements, an unaffordable pack cannot be bought, the sequence
  collapses under `prefers-reduced-motion`, and the page still fits the viewport.
- **`openspec/specs/shop/spec.md`** — its placeholder requirements are superseded.
- No new runtime dependency, no route change, and no change to the game, the board, or the deal.
