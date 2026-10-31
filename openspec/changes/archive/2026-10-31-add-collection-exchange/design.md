## Context

- The screen called "Cards" is `src/components/collection/` (class `Collection`, selector
  `app-collection`), served lazily at `/cards`. Its requirements live in
  `openspec/specs/collection/spec.md`. It relies on `src/model/collection.ts` (owned-card sorting
  and rarity grouping), `collection-grid`, `card-menu`, `card-reader`, `deck-bar`, and
  `confirm-dialog`.
- `UserState` (`src/model/user.ts`) is plain data: `geo`, `collection: Map<CardKey, number>`, and
  `decks`. Pure functions change it. `UserService` holds one signal and commits changes through
  `apply(op)`, which returns `null` for a refusal and persists only on success. The persisted
  record is at `SCHEMA_VERSION = 2`, and `parsePersistedUser` dispatches on the version (1 is
  upgraded to 2).
- Decks don't consume cards. The only invariant tying them to the collection is that a deck holds
  no more copies than are held. Today that is enforced on add (`addRefusal`) and on load
  (`fromPersisted` keeps the earliest copies). Nothing yet lowers a quantity at runtime. Selling is
  the first operation that does.
- The catalogue (`CARD_DB`) holds only set `FC` (15 cards). The pack posters
  `card-pack-gp.png` and `card-pack-ct.png` show that Greenpath and City of Tears are planned.
- The Geo amount is `src/components/geo/` plus `.geo-amount`/`.geo-mark` in
  `src/styles/primitives.css`. The mark's `alt` is the currency's accessible name.
- `public/images/rosarie.webp` (360×332, transparent) is untracked.

## Goals / Non-Goals

**Goals:**

- One pure, tested implementation each of the prices, buying, selling, and deck trimming in
  `src/model/`. The page only reads from it and asks for changes.
- Rename the Decks page without changing its behaviour. The existing e2e coverage of it should keep
  passing after mechanical renames.
- Keep the Rosary amount and the Geo amount visually one family, with one CSS definition.

**Non-Goals:**

- No generic multi-currency abstraction. There are exactly two currencies, and each gets its own
  field and primitive.
- No reuse of `card-menu` or `card-reader` on the Collection page. Exchange controls are always
  visible under each tile, not behind a selection.

## Decisions

### 1. Move the Decks page into `src/components/decks/`, then build the new page at `src/components/collection/`

Do the move as its own commit first: `git mv` the folder, rename the class to `Decks` and the
selector to `app-decks`, and update the title and route. Then create the new `Collection` page in
the folder the move freed. Doing the move as a separate commit keeps git's rename detection
intact, so the Decks page's history follows it.
*Alternative*: leave the Decks page where it is and name the new page `collection-page`. Rejected
because the folder names would then contradict the screen names, as the spec capability did.

`src/model/collection.ts` stays where it is. It describes the player's collection, which both
pages read. The Decks page's grid components keep their names.

### 2. Prices and exchange live in a new `src/model/exchange.ts`

```ts
export const ROSARY_PRICE_PER_STAR = Object.freeze({ sell: 10, buy: 100 });
export function salePrice(card: Card): number;      // stars × sell
export function purchasePrice(card: Card): number;  // stars × buy
export function buyCard(state: UserState, card: Card): UserState | null;   // null if unaffordable
export function sellCard(state: UserState, card: Card): UserState | null;  // null if not held
export function decksTrimmedBySale(state: UserState, card: Card): number[]; // deck indices
```

These functions have the same shape as `deck.ts`: they are pure, return `null` for a refusal, and
fit `UserService.apply`. That gives atomicity for free: one `update()` both changes the balance
and changes the collection and decks. `sellCard` computes the new quantity and then calls a new
`deck.ts` helper, `trimDecks(decks, key, quantity)`. That helper drops copies from the end of each
deck until it is within the quantity, then compacts with `filter`, so positions stay contiguous.
`decksTrimmedBySale` is that same helper's "which decks change" question, so the warning can never
disagree with the sale.
*Alternative*: forbid selling copies in use. Rejected by the user ("sell any card you have").

The property that a sale price is below its purchase price follows from 10 < 100. A unit test
asserts it over the whole catalogue.

### 3. `UserState.rosaries`, schema version 3

Add `readonly rosaries: number` to `UserState`, and `rosaries: 0` in `seedUser()`.
`PersistedUser` gains `rosaries`. `parsePersistedUser` accepts versions 1, 2, and 3: v1 has no
decks and 0 Rosaries, v2 has 0 Rosaries, and v3 requires `isCount(rosaries)` or the record is
rejected, the same rule `geo` follows. `UserService.load` already rewrites any record not at the
current version. `UserService` gains a `rosaries` computed signal plus `buyCard(card)` and
`sellCard(card)` through `apply`. `reset()` needs no change, because `seedUser()` is the
definition.

### 4. Named sets are a stated list in `card.ts`

```ts
export const CARD_SETS = Object.freeze([
  { id: 'FC', name: 'Forgotten Crossroads' },
  { id: 'GP', name: 'Greenpath' },
  { id: 'CT', name: 'City of Tears' },
] as const);
```

At module load, assert that ids and names are unique and that every `CARD_DB` card's set is
listed. This runs the same way `indexByKey` does, so a mistake fails at app start and in tests.
Also export `cardsInSet(id)`, sorted by number. Empty sets are allowed and render as forthcoming
sections.

### 5. Rosary primitive mirrors Geo and shares its CSS

`src/components/rosary/` (`app-rosary`, `host: { class: 'rosary-amount' }`) renders
`<span class="rosary-value">` followed by `<img class="rosary-mark" src="/images/rosarie.webp"
alt="Rosaries">`. In `primitives.css`, extend the existing selectors, for example
`.geo-amount, .rosary-amount { … }` and `.geo-mark, .rosary-mark { … }`, rather than copying the
rules. Visually the two primitives then differ only in their artwork. Tune the mark's em size by
eye if the rosary art reads too large next to Geo.

### 6. Collection page layout

The page has two rows, like the Decks page: a pinned top bar and the scrolling sections. It never
uses `position: sticky`.

- **Top bar**: a three-column grid, `1fr auto 1fr`, with the single-line screen header spanning
  the middle and left columns, laid so the rules can shorten. The purse sits in the right column,
  justified to the end. This keeps the purse in the top-right corner, and the header's rules give
  way rather than overlapping it. The purse is `<p aria-label="Your Rosaries"><app-rosary>`, as the
  Shop's purse is built.
- **Sections**: `<section aria-labelledby>`, one per `CARD_SETS` entry, with a left-aligned heading
  ("Forgotten Crossroads" followed by a rule, then the progress counter `9 / 15` with a visually
  hidden "of 15 collected"). The grid copies `collection-grid.css`'s fixed 150px track
  (`repeat(auto-fit, var(--tile-w))`, `justify-content: start`), which keeps every card inside the
  renderer's 120 to 199px no-ability band.
- **Tile**: `<app-card>` at the tile width, with the overlay badge `3 held` or `Not owned`. An
  unowned tile gets a translucent void veil over the card (an overlay, not a `filter` on the
  renderer) plus the `Not owned` badge text, which survives colour removal. Below the card is a
  control row with two compact `hk-btn sm` buttons: `Buy <app-rosary>` and `Sell <app-rosary>`.
  When the card is unowned, the Sell button is not rendered. An empty, non-focusable spacer
  element holds its slot instead, so the Buy control doesn't move and no inert control is left
  behind.
- **Unaffordable buy**: `aria-disabled="true"` with a `title` and `aria-describedby` reason "Not
  enough Rosaries", and a click handler that returns early. This is the same pattern as the
  Decks page's disabled create-deck control, which keeps it focusable.
- **Trim warning**: when `decksTrimmedBySale` is non-empty, the Sell button shows a leading
  warning glyph (a text mark, not colour), and its `title` and `aria-describedby` read "Selling
  removes it from Deck 1 and Deck 3", using `deckName()`.
- **Announcements**: a visually hidden `aria-live="polite"` region on the page, set after each
  successful exchange.
- **Focus after selling the last copy**: once the Sell button disappears, use `afterNextRender` to
  focus the same tile's Buy button, located by a `data-buy` attribute keyed on the card key.

The page holds only screen state (the announcement text). Every fact is read from `UserService`
through `computed`, so changes made on the Shop or Decks page are already there on arrival.

Atmosphere (`void-bg`, `mist-layer`, particles) is copied from the Decks page's template with no
`.corner` elements. Reduced motion uses the global `prefers-reduced-motion` rules that the other
pages already follow. The tile entrance reuses the Decks page's keyframes.

### 7. Routing and nav

```ts
{ path: 'decks', loadComponent: () => import('../components/decks/decks').then(m => m.Decks) },
{ path: 'collection', loadComponent: () => import('../components/collection/collection').then(m => m.Collection) },
{ path: 'cards', redirectTo: 'decks' },
```

The nav adds a fourth `<li>` in the order Shop, Battle, Decks, Collection. Four `hk-btn lg`
buttons need to fit the narrowest supported viewport. Check this in e2e.

### 8. Spec structure

The Cards-page requirements move by REMOVE (from `collection`) and ADD (to `decks`). OpenSpec
can't move a capability or drop a scenario from a MODIFIED block. For the same reason, the two
navigation requirements whose scenario names mentioned "Cards" are removed and re-added under new
names. The `user/data-model` scenario "The three are independent" keeps its name even though
there are now four holdings, because a MODIFIED block can't rename it.

## Risks / Trade-offs

- **Selling the only copy of a card silently empties a deck slot.** → The sell control warns in
  advance and names the decks, and the live announcement repeats it. The Decks page's standing
  then reports the deck as incomplete. The user chose this over a confirmation step.
- **The 150px tile is tight for two price buttons.** → Use `hk-btn sm`, with amounts in tabular
  numerals. If six-star prices (600) overflow, stack the two buttons vertically under the card. A
  Playwright screenshot of a six-star-priced tile settles which.
- **A four-item nav may wrap on a small laptop.** → Covered by an e2e fit check. If it wraps, fall
  back to the primitive's default size step rather than inventing nav-only metrics.
- **Moving the `collection` folder while reusing its name** can confuse rename detection in a
  single commit. → Do the move in its own commit (decision 1).
- **Collection-page sections inherit the Cards-page Purpose text after archive.** → A task updates
  `openspec/specs/collection/spec.md`'s Purpose by hand after archive.

## Migration Plan

Stored v2 records upgrade to v3 automatically on first load, with 0 Rosaries, and are rewritten at
v3. To roll back to the previous build, note that it rejects v3 records (an unrecognised version)
and would reseed the player. That is acceptable for a pre-release game. Restoring would mean
clearing local storage or shipping a v3-tolerant reader. Old `/cards` links redirect.

## Open Questions

- Should the warning glyph on the Sell control be the existing status `!` mark from the Decks
  page's standing or a new icon? This is cosmetic. Decide during implementation.
