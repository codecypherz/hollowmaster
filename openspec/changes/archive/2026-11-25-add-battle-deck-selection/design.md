## Context

See proposal.md for motivation. The current state that shapes the approach:

- `Battle` (`src/components/battle/battle.ts`) calls `GameService.startGame()` and navigates to
  `/game` in one step. `startGame()` deals both hands at random from `CARD_DB` via `dealHands`.
- Decks are named by position and have no stable id (`user/decks`: "Decks are named by their
  position"). `deck.ts` already exposes `deckStanding` and `isBattleReady`, so eligibility is a
  solved question. `UserState` is plain data, changed only by pure functions that return
  `UserState | null`, and persisted at `SCHEMA_VERSION = 4`.
- `UserService.load()` runs in the app initializer, so no component ever sees the pre-load seed.
- The Decks page's pinned region is `DeckBar` (`src/components/deck-bar/`). It holds the deck
  buttons, the nine positions with region scaling (`fitOverlay`), the standing lines, and the
  create, delete, and remove controls. `CardReader` already renders with no action when
  `actionAvailable` is false and `actionReason` is empty.
- The nav shell is shown on every route except `/game*`, and its Battle link uses
  `routerLinkActive` with `exact: false`.
- Every e2e path into a match goes through `startMatch()` in `e2e/helpers.ts`, plus one inline walk
  in `e2e/collection.spec.ts`. Each clicks "Start Game" as a fresh player, who holds no Ready deck.

## Goals / Non-Goals

**Goals:**

- One source of truth for eligibility (`isBattleReady`). The screen never decides it separately.
- Share the deck row's look and its scaling with the Decks page rather than copying them.
- Keep the remembered choice consistent through deck deletion inside the pure deck operations, so
  no caller can forget it.

**Non-Goals:**

- Stable deck ids or deck names. Position stays the identity.
- Choosing an opponent deck, or changing how the opponent is dealt.
- Previewing the cards of an ineligible deck. Its button is disabled, and its contents are what the
  Decks page is for.
- Any change to the in-game screen.

## Decisions

### 1. Deck selection is a route, `/battle/deck`, not an overlay on the Battle page

It is eager like `battle` and `game`, because it sits on the critical path into a match. Nesting it
under `battle` keeps the nav's Battle link active with no nav change. The browser's back control
returns to Battle, and the screen is addressable for e2e.

- *Alternative: a modal over the Battle page.* That would skip a route, but the spec asks for the
  Decks page's full-page look. It would also need its own focus trap and would leave back-button
  behaviour undefined.

### 2. `DeckBar` gains a `mode: 'edit' | 'choose'` input (default `'edit'`)

In `choose` mode:

- The create and delete controls, their separator, and the Remove strips are not rendered.
- A new `eligible` predicate input marks a deck button `is-disabled` with `aria-disabled="true"`, a
  `data-tip` naming its problems ("Incomplete", "Invalid", or "Invalid · Incomplete"), and an
  `aria-describedby` reason. Clicks on it emit nothing.
- The empty state's text comes from the page rather than being hard-coded.

The standing list is unchanged. It shows "Ready for battle" for the only decks that can be chosen.

- *Alternative: a new `DeckPicker` component reusing the CSS.* That duplicates the scaling and
  measuring logic, and the positions' markup, and the two would drift. A mode flag costs a few
  `@if`s.
- *Alternative: hide ineligible decks entirely.* Rejected, because a missing Deck 2 between Deck 1
  and Deck 3 reads as a bug, and the positional names would no longer match the Decks page.

### 3. The remembered choice is `UserState.battleDeck: number | null`, kept by the deck operations

- `chooseBattleDeck(state, index)` is a new pure function in `deck.ts`. It returns `null` for an
  index no deck occupies or for a deck that is not `isBattleReady`.
- `deleteDeck` adjusts the record: an earlier deletion means `battleDeck - 1`, deleting the
  remembered deck itself means `null`, and a later deletion leaves it unchanged.
  `createDeck`, `addCardToDeck`, `removeCardFromDeck`, and `trimDecks` leave it alone.
- The screen's default is derived, not stored:
  `battleDeck` if it is Ready, else the first Ready index, else `null`. A helper
  `defaultBattleDeck(state)` sits beside `chooseBattleDeck`, so the page and its tests read one rule.
- The record is written when the player chooses a deck, and when a battle begins. Beginning with an
  untouched default therefore records it too.

Rationale: `UserState` is already the one persisted record behind the one storage boundary
(`user/persistence`). A second localStorage key would bypass that boundary.

- *Alternative: remember the deck's contents (a fingerprint) instead of its position.* That
  survives reordering, but there is no reordering. It would also break the first time the player
  edits the remembered deck, and position is how the user spec names decks.

### 4. Persistence goes to schema version 5

`PersistedUser` gains `battleDeck: number | null`. Version 4 records upgrade with `null` and are
rewritten, which the existing upgrade path already does. `parsePersistedUser` reads a value that is
not a non-negative integer as `null`, at the cost of that field only. `fromPersisted` clears a value
at or beyond the restored deck count. It does not check readiness, because `user/decks` keeps a
remembered deck that is ineligible.

### 5. `GameService.startGame(deck: Deck): boolean`

The method returns `false` and changes nothing unless `isBattleReady(deck)`. The player's hand is
`deck.cards.map(key => CARD_BY_KEY.get(key)!)` in order. The opponent's hand is
`dealHands(CARD_DB, 1, HAND_SIZE)[0]`. `dealHands` is kept as it is.

The page asks `UserService.chooseBattleDeck(index)` first, then calls `startGame(deck)`, and
navigates to `/game` only if it returned `true`. `GameService` stays free of `UserService`: it is
handed a deck rather than reaching for the user.

### 6. The page component `DeckSelect` (`src/components/deck-select/`)

- Screen state: a `chosen` signal. It is initialised from `defaultBattleDeck(users.state())`, and an
  effect re-clamps it if the decks change underneath. The page also holds a `reading` signal for the
  card reader.
- Layout: the same `page-wrap`, void background, mist, and particle field as `Decks`, the shared
  `screen-header` titled `Choose a Deck`, then `app-deck-bar mode="choose"`, then an action row with
  the primary `hk-btn` "Begin Battle". The deck region is vertically centred in the remaining space.
  No collection grid is shown. The page is a one-row-plus-actions grid, so it fits without
  scrolling. Region scaling comes from `DeckBar`.
- Disabled "Begin Battle" uses `aria-disabled` and a reason, never native `disabled`. That keeps it
  in the tab order, following the Decks page's pattern for the create control.
- No Ready deck: `DeckBar`'s empty-state slot says "None of your decks is ready for battle." with a
  `routerLink="/decks"` "Build a deck" link.
- Card reading: `<app-card-reader [card] (close)>` with no action inputs, so it shows only Close.

### 7. `Battle`'s control navigates to `/battle/deck`

The `startGame` output and subscription are replaced by a plain `router.navigate(['/battle/deck'])`.
`GameService` is no longer injected there. The button label stays "Start Game". Only its
destination changes.

## Risks / Trade-offs

- **Every existing e2e entry into a match breaks.** A fresh player has no Ready deck.
  → `startMatch()` first stores a user whose Deck 1 is the nine starter cards, which is a Ready deck
  by construction, then walks Battle → deck selection → Begin Battle. The inline walk in
  `collection.spec.ts` already has a full deck (it asserts nine deck cards), so it only gains the
  deck-selection click. `storeUser` writes version 5 and gains an optional `battleDeck`.
- **`DeckBar` grows a second mode.** → Mode-specific markup stays in `@if (mode() === 'edit')`
  blocks. The decks e2e suite runs unchanged as the regression guard for edit mode.
- **A Ready deck can hold a card the catalogue later drops.** `fromPersisted` already drops unknown
  keys, so such a deck loads as Incomplete and never reaches `startGame`. The `!` in the hand
  mapping is safe for the same reason. A Vitest case pins it.
- **The remembered position silently points at a different deck if decks are ever reordered.**
  → No reorder operation exists. If one is added, it must remap `battleDeck` the way `deleteDeck`
  does. The `user/decks` requirement already says so.

## Migration Plan

The schema bump is forward-only and automatic. A version 4 record loads, gains `battleDeck: null`,
and is rewritten at version 5. To roll back, revert the change. A version 5 record would then be
unreadable by the old code, which seeds a fresh user per `user/persistence`. That is acceptable for a
local, single-player save, and matches how earlier bumps were handled.
