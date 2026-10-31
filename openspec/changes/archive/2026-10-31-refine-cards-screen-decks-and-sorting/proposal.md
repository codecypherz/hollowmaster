## Why

The Cards page works, but its deck strip reads as a set of folder tabs pushed apart from the
controls that act on them, the deck limit hides a control instead of disabling it, and the
collection gives no sense of how much of a card a deck has already used. Sorting is also
one-directional and visually abrupt, and the rarity order — the page's default — runs every
rating together in one undifferentiated grid. Testing these flows also means clearing browser
storage by hand; a reset on the page removes that friction.

## What Changes

- **Reset control.** The Cards page gains an always-present debug control that, after
  confirmation, replaces the player's data with a brand-new player's (starter cards, zero Geo, one
  empty deck) and persists it.
- **Deck selectors become plain buttons.** The deck tab strip becomes a row of ordinary buttons in
  the page's button style. The diamond mark is removed entirely. The selected deck is still told
  apart by a non-colour cue, now a filled, bordered face instead of the mark. The rule that only
  the selected button spells out `Deck` is kept. **BREAKING** (tests): tab roles and roving
  tabindex are replaced by a group of toggle buttons.
- **Deck controls sit beside the deck buttons.** The + and trash controls follow the last deck
  button, still behind a visible separator. The buttons, the separator, and the controls are
  centred on the page as one group.
- **The deck limit disables rather than removes.** At nine decks the + control stays in place but
  is disabled, and its tooltip says that nine decks is the limit. The separate limit note is
  removed.
- **Every tile animates on reorder.** Changing the collection's order replays the tile entrance
  for every tile, not only for the tiles the DOM happened to move.
- **Held and used counts.** Each collection tile's badge states how many copies are held and how
  many of them the selected deck uses, for example `2 / 3`, worded so the player can tell which
  number is which.
- **BREAKING** (rule): **Quantity held now limits use within one deck.** A deck may hold at most
  as many copies of a card as the collection holds. The limit applies to each deck separately: one
  held copy still allows that card in every deck, once each. Adding past the limit is refused, and
  the page withholds the add action and says why. Stored decks over the limit are trimmed on load.
- **Sort direction toggle with a chevron.** The active order shows a chevron for its direction.
  Choosing the active order again reverses it. Choosing a different order starts in that order's
  default direction: descending for the numeric orders, A→Z for name.
- **Rarity sections.** When ordered by rarity, the collection is split into one labelled section
  per star rating held, with the sections in the order in effect.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `collection`: deck selector presentation, control placement and limit behaviour, the count
  badge (held + used), the add action withheld at the per-deck copy limit, a player-reversible
  sort direction with a chevron, rarity sections, whole-grid reorder animation, and the reset
  control.
- `user/decks`: "Quantity held does not limit use in a deck" is replaced by a per-deck copy limit
  equal to the quantity held. The list of reasons an addition is refused gains "no copy left".
- `user/persistence`: a restored deck is trimmed to the per-deck copy limit, in addition to the
  existing ownership and size trims.

## Impact

- **Model:** `src/model/deck.ts` (copy-limit check in `addCardToDeck`, plus a `copiesInDeck`
  helper), `src/model/collection.ts` (sort direction, rarity grouping), `src/model/user.ts`
  (`fromPersisted` trim).
- **Service:** `src/services/user.service.ts` gains `reset()`.
- **Components:** `deck-bar` (buttons, layout, disabled create), `collection` (sort state with
  direction, chevron, reset control and its confirmation, add availability per card),
  `collection-grid` (sections, badge, replay animation).
- **Tests:** Vitest specs for deck, collection, user, and the user service. Several `e2e/cards.spec.ts`
  tests add the same card more than once, so they must seed quantities. The tab-role tests are
  rewritten for buttons, and the limit test now expects a disabled control instead of a missing one.
