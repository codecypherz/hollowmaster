## Why

A player can now buy packs and accumulate cards, but the cards go nowhere. `UserService` holds a
growing multiset that no screen renders, the Cards page is still the honest placeholder it was
built as, and `GameService.startGame()` deals both hands out of `CARD_DB` regardless of what the
player owns. The collection is write-only.

This change gives the collection somewhere to be seen and something to be *for*: **decks**. A deck
is the player's stated selection of nine cards, assembled from what they have unlocked, and the
Cards page becomes the place they are assembled. It is the second half of the progression loop's
front end — packs fill the collection, decks give the collection a purpose — and it is the
prerequisite for the match eventually being played from a deck rather than from the catalogue.

## What Changes

**Decks as part of the user record.** A third thing the one user carries, beside the collection and
the Geo balance.

- A deck is an **ordered list of 0 to 9 cards**, drawn from the cards the player has unlocked.
- **A card's quantity does not limit its use.** Owning one Crawlid permits nine Crawlids in a deck,
  and permits a Crawlid in every deck at once. Quantity is a collection fact; it is not spent,
  reserved, or consumed by deck building. Unlocking a card — holding at least one copy — is the
  only gate.
- A player holds **at most 9 decks**, and may hold none.
- Decks are **named by their position**: Deck 1 through Deck 9, with no gaps. Deleting Deck 2
  renames the former Deck 3 to Deck 2. There is no stored name and nothing to type.
- A new player is seeded with **one empty deck**, so the Cards page has a deck to build into on
  first arrival.
- Decks **persist** with the rest of the user record.

**The Cards page becomes the collection and deck builder.** The placeholder is replaced by a
two-region screen:

- **Pinned at the top**: a tab strip of the player's decks, the selected deck laid out as its nine
  positions — filled ones rendering the card, empty ones rendering an empty slot — a control to
  create a deck, and a control to delete the one on screen. The pinned region does not scroll away.
- **Scrolling below it**: every card the player owns, rendered through the shared card renderer at
  a width in the 120–199px band, so the renderer's own ability gate is what withholds the ability
  text. Each tile carries a **count badge** stating how many copies are held, drawn at the bottom
  of the tile without obscuring the card's name, stars, stat bars, or any of its eight chevrons.
- **Sorting**: the collection can be ordered by rarity, quantity, name, attack, or defense. Each
  order carries its own natural direction — highest first for the four numeric orders, A→Z for
  name — and every order is total, so equal cards do not shuffle between renders. The screen opens
  on **rarity, rarest first**.
- **Selecting a card raises a small action menu over that card**: *Add* and *Read* in the
  collection, *Remove* and *Read* in the deck. Adding appends to the selected deck; removing takes
  out the copy at that position, so one of three Crawlids can be removed without disturbing the
  other two.
- **Reading opens the card at full size** in an overlay, above the renderer's 200px gate, where the
  ability text, set, and number are legible. The overlay can also add the card to the deck, so
  reading before committing does not cost the player their place.
- **Deleting a deck is confirmed** before it happens; adding and removing cards are not, because
  they are trivially reversible.

**Nothing about a match changes.** `GameService` still deals from `CARD_DB`. Playing a deck raises
its own questions — what a deck of fewer than nine cards deals, where the opponent's nine come
from — and belongs to its own change.

**Not in scope:** dealing a match from a deck; an "active deck" for play; naming or reordering
decks; copying or duplicating a deck; showing unowned catalogue cards as gaps to be filled;
filtering or searching the collection; sort-direction toggling; selling, trading, or otherwise
losing cards; any change to pack composition, the Shop, or the card renderer itself.

## Capabilities

### New Capabilities

- `user/decks`: What a deck is and the rules that govern it — the 0-to-9 card contents, the
  at-most-9-decks limit, duplicates without regard to quantity, unlocking as the only gate on
  which cards may be used, positional naming, the one empty deck a new player is seeded with, and
  the operations that create, delete, and edit a deck. Sits beside `user/data-model` for the same
  reason `user/persistence` does: it is a distinct body of rules over the same one user.

### Modified Capabilities

- `user/data-model`: Its opening requirement states that the user "SHALL carry exactly two things:
  a collection of cards and a balance of the currency named Geo". The user now carries a third —
  their decks — and the requirement that fixes the count has to say so. Nothing about the
  collection multiset or the Geo invariants changes.
- `user/persistence`: The persisted record must now carry decks as well as the collection and the
  balance, which moves the schema to version 2. A version 1 record is upgraded rather than
  discarded — it is a complete user that simply has no decks — so no existing player is reseeded.
  Deck entries naming a card the catalogue has lost, or a card the restored collection does not
  hold, are dropped the way unknown collection entries already are.
- `collection`: The Cards page stops being a placeholder. Its requirement that the page mark its
  content as forthcoming and "not present an owned-card collection or a saved deck as though it
  were real player data" is exactly what this change contradicts, so it is removed and replaced by
  the real screen: the pinned deck region and its tabs, the scrolling collection, the count badge,
  the five sort orders and their default, the card action menu, the reading overlay, deck creation
  and confirmed deletion, and how the whole thing fits a viewport it is not allowed to scroll.

## Impact

- **`src/model/deck.ts`** (new) — the `Deck` shape, `MAX_DECKS` and `DECK_SIZE`, the positional
  name, and the pure operations over a deck and over a list of decks (create, delete, add a card,
  remove the card at a position), each refusing rather than throwing when a limit or the unlocked
  gate would be broken.
- **`src/model/collection.ts`** (new) — the owned-card projection the grid renders (card plus
  quantity) and the five total orders, so the sort is unit-testable without a browser.
- **`src/model/user.ts`** — `UserState` gains `decks`; `seedUser()` gains the one empty deck;
  `SCHEMA_VERSION` moves to 2 with a version 1 reader; `toPersisted`/`parsePersistedUser` gain the
  deck array and its per-entry validation.
- **`src/services/user.service.ts`** — deck commands (`createDeck`, `deleteDeck`, `addCardToDeck`,
  `removeCardFromDeck`) applied through the same single-`update()`-then-persist shape the existing
  commands use, each a no-op when the model refuses.
- **`src/components/collection/`** — rewritten from the placeholder into the screen, keeping the
  void background, particle field, corner frame, and ornament vocabulary.
- **`src/components/deck-bar/`** (new) — the pinned region: the deck tabs, the nine positions, and
  the create and delete controls.
- **`src/components/collection-grid/`** (new) — the scrolling grid of owned cards and the count
  badge.
- **`src/components/card-menu/`** (new) — the two-action menu raised over a selected card, shared
  by the deck and the grid so the two cannot drift.
- **`src/components/card-reader/`** (new) — the reading overlay, rendering the shared card renderer
  above its 200px gate.
- **`src/components/card/`** — unchanged. The "smaller version without ability text" is the
  renderer's existing width gate, not a new mode.
- **`src/styles/tokens.css`** — no new token expected; the badge, tabs, and menu are drawn from the
  gold and soul ramps already declared.
- **Tests** — Vitest for the deck limits, the duplicate and unlocked-only rules, positional naming
  across a deletion, the five sort orders and their tie-breaks, the seeded deck, the version 2
  round trip, the version 1 upgrade, and the dropping of invalid deck entries. Playwright for what
  only a browser settles: the deck region staying pinned while the collection scrolls, the page
  itself not scrolling across the viewport ladder, collection tiles laid out in the 120–199px band
  with no ability text, the reading overlay above the gate with ability text, the count badge
  obscuring nothing, and the screen under a reduced-motion preference.
- No new runtime dependency, no route change, and no change to the game, the board, the deal, or
  the Shop.
