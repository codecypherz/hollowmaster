## Why

The player can view the cards they own only while building a deck, and the only way to get a card
is to open a pack and hope for it. The player can't see how much of a set they have collected, and
a card they hold too many copies of is no use to them. A Collection screen with its own currency,
Rosaries, lets the player track their progress through each set and trade cards for ones they
want. Renaming today's "Cards" screen to "Decks" names that screen after its job and frees the
word "Collection" for the new screen.

## What Changes

- **Rename the Cards screen to Decks.** Its nav label, header title, and route change: `/cards`
  becomes `/decks`, and the old `/cards` address redirects to `/decks` so saved links keep working.
  Behaviour is otherwise unchanged. Its requirements move from the `collection` capability to a new
  `decks` capability. **BREAKING** for anything that addresses `/cards` or the `Cards` label.
- **Add a Collection screen** at `/collection`, reached from a fourth nav destination. The nav order
  becomes Shop, Battle, Decks, Collection.
  - It has one section per card set, such as Forgotten Crossroads, each headed by the set's name and
    how much of the set the player has collected. Every card in the set is shown in set-number
    order, owned or not.
  - Owned cards show how many copies are held. Unowned cards are marked as not owned with a cue that
    doesn't rely on colour alone.
  - Every card can be bought for Rosaries, including more copies of one already held. Every held
    card can be sold for Rosaries.
  - Prices are set by rarity: a card sells for 10 × its stars and costs 100 × its stars to buy.
  - The Rosary balance appears in the top-right corner of the screen.
  - No corner frame is drawn. The atmosphere (void, mist, particles) stays.
- **Add a second currency, Rosaries.** It is part of the one user, starts at zero, can never go
  negative, and is persisted with the user. The stored record moves to schema version 3, and
  version 1 and 2 records are upgraded with zero Rosaries. For now selling cards is the only way to
  earn Rosaries.
- **Selling can shrink decks.** Decks don't consume cards, so a sale can leave a deck holding more
  copies of a card than the player now holds. Each deck in that position loses its extra copies,
  starting from the latest positions, in the same step as the sale. When a sale would trim decks,
  the sell control warns which decks before the player sells.
- **Add a Rosary amount primitive.** It works like the Geo amount: the numeral followed by the
  Rosary mark (`/images/rosarie.webp`), announced as "N Rosaries", and the word is never set beside
  the amount.
- **Give each card set a display name.** `FC` is Forgotten Crossroads, `GP` is Greenpath, and `CT`
  is City of Tears. Every catalogued card must belong to a named set. A named set with no cards yet
  is shown on the Collection screen as forthcoming.
- **The Decks page's debug reset also resets Rosaries,** and its confirmation says so.

## Capabilities

### New Capabilities

- `decks`: The Decks page (formerly the Cards page). It holds the deck building requirements that
  move out of `collection` under the new name, plus a reset that also covers Rosaries.

### Modified Capabilities

- `collection`: All of the Cards-page requirements are removed (they move to `decks`). It is
  rewritten as the Collection screen: set sections, owned and unowned tiles, buying, selling, the
  Rosary purse, fit, keyboard, motion, and no corner frame.
- `user/data-model`: The user now carries a Rosary balance as a fourth holding. Adds Rosary
  balance rules, rarity-derived prices, buying a card with Rosaries, and selling a card. A purchase
  that spends and grants together now covers either currency.
- `user/decks`: Adds that losing copies of a card trims every deck that would exceed the quantity
  held. The deck-limit wording now names the Decks page.
- `user/persistence`: Rosaries are persisted. Schema version 3, with v1 and v2 records upgraded to
  zero Rosaries. A fresh user holds zero Rosaries.
- `cards/data-model`: Every card's set is a named set, and the named sets are stated in one ordered
  place.
- `design-system/primitives`: Adds the Rosary amount primitive and its legible, named mark.
- `design-system/style-guide`: Adds the Rosary amount to primitive coverage. Route and screen lists
  name the Decks and Collection pages.
- `navigation/routing`: Routes for Decks (`/decks`) and Collection (`/collection`), with `/cards`
  redirecting to `/decks`. Page state boundaries cover all four pages.
- `navigation/shell`: Four destinations in the order Shop, Battle, Decks, Collection.
- `battle`: The entrance scenario for returning from another page names the Decks and Collection
  pages instead of the Cards page.

## Impact

- **Model**: `src/model/user.ts` (Rosary balance, schema v3, sell/buy and deck trimming),
  `src/model/deck.ts` (trimming helper), `src/model/card.ts` (named sets), and a new pricing module.
- **Service**: `src/services/user.service.ts` gains `buyCard` and `sellCard` commands, and the
  `rosaries` signal.
- **UI**: The existing `src/components/collection/` component and its route become the Decks page.
  A new Collection page component, a `rosary` amount component, and nav and route changes are added.
- **Assets**: Commit `public/images/rosarie.webp`, which is currently untracked.
- **Tests**: Vitest coverage for prices, buy/sell, trimming, and persistence upgrades. The e2e suite
  is updated for the `/decks` route and `Decks` label, and gains a Collection-page spec for fit, no
  corner frame, the purse position, owned and unowned cues, and buy/sell round trips.
- **Specs**: After archive, `openspec/specs/collection/spec.md` keeps its old Cards-page Purpose
  text and needs a new Purpose by hand.

## Non-goals

- Reading a card at full size from the Collection screen.
- Exchanging Geo for Rosaries, or any other way to earn Rosaries than selling cards.
- Bulk buy or sell, quantity pickers, or undo.
- Showing the Geo balance on the Collection screen.
