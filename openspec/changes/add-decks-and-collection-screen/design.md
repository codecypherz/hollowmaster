## Context

See `proposal.md` — Why. What shapes the approach here is what already exists:

- **`UserState` is plain, immutable data** (`src/model/user.ts`): `{ geo, collection: ReadonlyMap<CardKey, number> }`, with pure functions over it and `UserService` holding one in a signal and persisting on every change. Decks have to arrive in that shape or the persistence and the service both grow a second style.
- **Cards are keyed by catalogue identity.** `CardKey` (`FC#7`) is what the collection is keyed by and what persisted data resolves against. A deck is a list of cards; there is already exactly one way to name a card without copying it.
- **The card renderer decides for itself what to draw at a given width** (`openspec/specs/design-system/card/spec.md`): 120px minimum laid-out width, ability section gated at 200px, ornament degrading toward the minimum. "A smaller card without ability text" is therefore not a mode to build — it is a width band to lay out in: **120 ≤ w < 200**.
- **A surface that cannot host its cards scales itself.** `src/model/arena.ts` computes a laid-out unit and a viewing scale for the in-game screen because CSS cannot divide one length by another; `fitOverlay()` in `pack-opening.ts` does the same for the opening. The Cards page's pinned deck row has exactly this problem.
- **Persisted data is at version 1** and `parsePersistedUser` requires exact equality with `SCHEMA_VERSION`, with a comment stating the choice this change now has to make: bump and add a reader for the old shape, or bump and reseed everyone.

## Goals / Non-Goals

**Goals:**

- One place where deck rules live, pure and unit-testable, with the service doing nothing but apply them and persist.
- A screen whose "smaller card" and "larger card" both come from the shared renderer's own width behaviour, so no second card face exists anywhere.
- A collection order that is stable under re-render, so the grid never reshuffles under the player's hand.
- A schema move that costs no existing player their collection or their Geo.

**Non-Goals (design level, beyond the proposal's scope list):**

- Drag-and-drop deck building. Adding is an action on a card, not a gesture.
- A general popover/menu primitive. The action menu is two buttons over a card and is shared by exactly two call sites.
- Virtualised scrolling of the collection. The catalogue holds fifteen cards; a grid of every distinct card is small for the foreseeable future.

## Decisions

### 1. A deck is an ordered list of `CardKey`, and its identity is its position

```ts
export interface Deck {
  readonly cards: readonly CardKey[];   // 0..DECK_SIZE, duplicates permitted
}
export const MAX_DECKS = 9;
export const DECK_SIZE = HAND_SIZE;     // a deck is a hand's worth of cards
```

`CardKey` rather than `Card`: a deck is a *selection*, and storing the object would duplicate catalogue data into the user record and break the "persisted data names cards, never describes them" rule the collection already follows.

**Ordered list rather than a multiset**, even though the game will not care about order: the screen shows nine positions, and removing "the second of three Crawlids" needs a position to name. A multiset would make every removal ambiguous.

**No stored id and no stored name.** The decks are an ordered array; deck *n* is `Deck ${n+1}`. This follows directly from the chosen naming: deleting Deck 2 genuinely renames Deck 3, so a stable identity would be an identity nothing displays. It also keeps the persisted shape to an array of arrays with nothing to validate but card identities.

- *Alternative considered — a stable `id` per deck.* Buys correct DOM identity across a deletion and a place to hang a future name. Rejected for now: it adds a field to persist and validate in exchange for nothing the screen shows. If deck names arrive later, `Deck` is already an object, so the field is additive.
- *Consequence:* the tab strip tracks by index. After a deletion the tab that read `Deck 3` re-renders as `Deck 2` with the next deck's cards — which is the correct outcome, not a bug to work around.

`DECK_SIZE` is defined as `HAND_SIZE` rather than as a second `9`. A deck is a hand's worth of cards; that is why it is nine, and when the deal eventually reads a deck the two must not be separately declared. `MAX_DECKS` is its own constant — nine decks is a different nine, and its equality with `HAND_SIZE` is a coincidence.

### 2. The deck rules are pure functions over `UserState`, not over a `Deck`

The unlocked-card gate needs the collection, and the "at most nine decks" rule needs the list. Writing `addCard(deck, key)` would put the gate somewhere else — almost certainly in the service, next to the signal, where it cannot be tested without one. So `src/model/deck.ts` exposes:

```ts
createDeck(state): UserState | null
deleteDeck(state, deckIndex): UserState | null
addCardToDeck(state, deckIndex, card): UserState | null
removeCardFromDeck(state, deckIndex, position): UserState | null
deckName(deckIndex): string
```

**`null` is the refusal.** The spec requires every refused operation to change nothing, report that it did not happen, and raise nothing. Returning `UserState | null` makes "nothing happened" unrepresentable as a half-applied state, and the service's method becomes `const next = addCardToDeck(...); if (!next) return false;` — the same shape `purchase()` already has.

- *Alternative considered — throwing on a broken limit.* Rejected: these are player actions reached from a UI that already withholds the control, so a refusal is an expected outcome, not a defect. `card.ts` throws because its input is hand-authored source; this input is a click.
- *Alternative considered — returning the same state object on refusal and comparing by identity.* Rejected as a silent contract; a caller that forgets the comparison persists a no-op write.

### 3. The collection projection and the five orders live in `src/model/collection.ts`

```ts
export interface OwnedCard { readonly card: Card; readonly quantity: number; }
export type SortKey = 'rarity' | 'quantity' | 'name' | 'attack' | 'defense';
export const SORTS: readonly { key: SortKey; label: string }[];
export function ownedCards(collection): OwnedCard[];   // catalogue order
export function sortOwned(owned, key): OwnedCard[];
```

**Each order carries one fixed direction**, stated in the sort's own definition: rarity, quantity, attack, and defense descend; name ascends. No direction toggle — the requirement asks for five values to sort by and one default, and a toggle doubles the control's states and the test matrix for a need nobody has stated. It is additive later: `SortKey` becomes `{ key, direction }`.

**Every order is total**, via one tie-break ladder applied after the primary comparison: **name (A→Z, `localeCompare('en')`), then `cardKey`**. Name alone is not total — two cards could share a name — and `cardKey` is unique by construction, so the ladder terminates. This is what keeps the grid from reshuffling when a signal re-emits, and it is asserted in Vitest rather than observed in a browser.

Sorting is applied to the *projection*, not to the map: `ownedCards()` walks `CARD_DB` in catalogue order and keeps what the collection holds, so the input to every sort is itself deterministic regardless of the map's insertion order (which depends on what packs the player opened in what order).

### 4. Schema version 2 with a version 1 reader

`SCHEMA_VERSION` moves to 2. `parsePersistedUser` dispatches on the version instead of demanding equality:

- **version 2** — collection entries plus `decks: string[][]`-shaped entries (each an array of `{ set, number }`), validated per entry the way collection entries already are.
- **version 1** — read with the existing rules and upgraded to `{ ...v1, decks: [] }`. A version 1 record is a complete user that predates decks; discarding it would cost a player their collection and their Geo for a feature they never used.
- **anything else** — `null`, as today, and the caller seeds.

An upgraded record is written back at version 2 by the next persist, which every deck action triggers anyway; the load path also persists after an upgrade so a read-only session still settles the shape.

**Restoring enforces the invariants rather than trusting them.** Decks beyond the ninth are dropped, cards beyond a deck's ninth position are dropped, a card the catalogue has lost is dropped, and a card the *restored collection* does not hold is dropped. The last is the important one: it means no load can produce a deck using a card the player has not unlocked, so the rest of the application never has to defend against one. A deck entry that is not an array at all costs only that deck — the same "one bad entry costs one entry" rule the collection already follows.

- *Alternative considered — bump and reseed.* Cheaper by one function, and the comment in `user.ts` explicitly allows it. Rejected because the Shop now sells packs for Geo: reseeding is not a tidy-up, it is taking the player's cards away.

### 5. The page is two rows; only the lower one scrolls

```
┌──────────────────────────────────────────┐
│  tabs   Deck 1 | Deck 2 | +              │  pinned region
│  [ 9 deck positions, one row ]           │  (grid row: auto)
│  filled 4/9        sort: Rarity ▾  Delete│
├──────────────────────────────────────────┤
│  collection grid, overflow-y: auto       │  (grid row: 1fr)
└──────────────────────────────────────────┘
```

The host already takes `flex: 1` under the nav shell, so the page has a bounded height to divide. The page wrapper is `display: grid; grid-template-rows: auto 1fr; overflow: hidden`, and the collection region is the only element with `overflow-y: auto`. Nothing is `position: sticky`: the pinned region is pinned because it is a grid row that does not scroll, which cannot be defeated by a long collection the way a sticky element inside one scroller can.

**The sort control sits in the pinned region**, not above the grid, for the same reason the tabs do — a control that scrolls out of reach is a control the player has to scroll back for.

### 6. Deck positions are laid out at a fixed unit and the region is scaled to fit

Nine positions in one row at the card's minimum is `9 × 120 + 8 × gap`, already wider than the 1100px viewport the project's fit ladder includes. The card spec's sanctioned answer is a uniform scale over the whole region, and that is a ratio of two lengths, which CSS cannot compute — the same wall `arena.ts` and `fitOverlay()` hit.

So the deck row lays its positions out at a **fixed unit above the minimum** (`--deck-cw`, 128px) and the region carries `transform: scale(var(--deck-scale))`, measured from the region's available width against its natural width. `fitOverlay()` already computes exactly this, so it moves from `pack-opening.ts` to **`src/model/fit.ts`** and both surfaces import it. That move is a pure relocation — no behaviour changes, so no spec moves with it.

- *Alternative considered — wrapping the nine positions into a 3×3 block on narrow viewports.* Rejected: the block is three card-heights tall, which eats the collection the pinned region exists above.
- *Alternative considered — scrolling the deck row horizontally.* Rejected: the deck's whole job in this screen is to be seen at a glance while the collection scrolls.

### 7. Collection tiles have a fixed width, not a fractional one

`grid-template-columns: repeat(auto-fill, var(--tile-w))` with `--tile-w: 150px`, centred, rather than `minmax(150px, 1fr)`. A fractional track grows with the viewport, and at a wide enough viewport a tile would cross 200px and the renderer would start drawing ability text — the requirement "a collection tile shows no ability text" would be violated by a wide monitor and by nothing the code says. A fixed track keeps every tile in the 120–199 band by construction. The band is asserted in the browser suite at the widest viewport on the ladder, which is where a fractional track would have failed.

### 8. Selection reuses the renderer's own interactive state; the menu is a sibling overlay

The card renderer already exposes `interactive`, `selectable`, `selected`, and `(select)`, rendering an accessible `<button>` with `aria-pressed`. A tile uses those: `selected` is "this card's menu is open", and `(select)` opens it. This costs no change to the renderer — which the card spec would not welcome — and gets keyboard reachability and focus styling for free.

The menu itself is `src/components/card-menu/`, absolutely positioned within the tile, so opening it cannot reflow the grid. One open menu at a time is one signal on the screen component: `openMenu = signal<{ region: 'deck' | 'collection'; index: number } | null>(null)`. Escape and a click outside clear it.

- *Trade-off:* `aria-pressed` announces the card as pressed rather than as a popup owner; `aria-haspopup` would be the precise attribute and the renderer does not expose it. Accepted for this change — the menu's buttons are the next focus stop and are labelled with the card's name, so the action is never ambiguous in practice. Adding an `aria-haspopup` input to the renderer is a card-spec change and belongs with one.

### 9. Reading is an overlay; so is confirming a deletion

`src/components/card-reader/` renders one `<app-card>` at a width comfortably above the 200px gate inside a `role="dialog" aria-modal="true"` overlay, in the same idiom as `pack-opening`'s. It takes the card *and* the action available for it, so the deck action offered when reading is the same one the menu offered, decided by the caller rather than re-derived.

The delete confirmation is a small `role="alertdialog"` in the same idiom rather than an inline two-step control, because an inline confirm changes the pinned region's height and therefore moves the collection under the player mid-decision.

No confirmation for adding or removing a card: both are one action to undo.

### 10. The selected deck is screen state, not user state

Which deck is on screen lives in the Cards page component, not in `UserState`. Nothing else in the application reads it — the deal still comes from `CARD_DB` — so persisting it would be persisting a scroll position. When a match is eventually played from a deck, "the deck to play" is a *different* fact from "the deck being edited", and that one will belong in the user record with its own rules.

## Risks / Trade-offs

- **Bumping the schema is one-way.** → A version 1 record upgrades to 2, but code reverted to the version 1 reader treats a version 2 record as unrecognised and reseeds. The revert window is the risk, not the upgrade. Mitigated by the reader being small and by unit tests for both directions of the round trip; accepted because nothing is deployed to players yet.
- **The count badge must sit over the card without covering anything it draws.** → The card's bottom edge carries the SW, S, and SE chevrons, and the gaps between them are narrow. The badge is placed straddling the bottom rim, offset toward the right, in the gap between the S and SE chevrons, and the browser suite asserts that all eight chevrons and both stat bars are visible with the badge up. If the placement proves fragile, the fallback is to move the badge fully outside the card's rim into the tile's gutter — still "on the bottom of the tile", still an overlay on the tile, and obscuring nothing at all.
- **A fixed tile width means the grid's last row can leave a wide gutter** on very wide viewports. → Accepted, and centred so it reads as a margin rather than as a left-aligned oddity. The alternative fails the ability-gate requirement.
- **Scaling the pinned region makes its rendered height smaller than its laid-out height**, so the grid row that holds it must measure the scaled height or the collection starts too low. → The region is laid out inside a wrapper whose height is set from the same scale, the way the in-game arena already handles its viewing scale; the browser suite's fit ladder is what catches it if it drifts.
- **Nine decks × nine cards is a small write on every click.** → The whole user record is already rewritten on every grant and purchase; nine decks of nine identities is smaller than the collection beside it.
- **Deck positions and collection tiles are both `app-card` at different units**, so a careless change to one unit could push either out of its band. → Both units are declared as named custom properties in one stylesheet each, and the browser suite asserts the band rather than the number.

## Migration Plan

1. Ship the model, service, and persistence changes first: version 2 writes, version 1 upgrades, the invariants enforced on load. At this point no screen has changed and a reload of an existing browser silently gains an empty deck list.
2. Ship the screen against that model.
3. Rollback: reverting the code leaves any browser that has written a version 2 record unreadable to the version 1 reader, and that player is reseeded. Acceptable pre-release; if it ever is not, the version 1 reader is the template for a version 2 reader kept alongside.

There is no server, no migration job, and nothing to coordinate: every record upgrades on the machine that holds it, the first time that browser loads the new code.
