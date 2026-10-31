## Why

The Cards page can now build real decks, but the pinned region at the top is taller and noisier than
it needs to be, and it never tells the player whether a deck can actually be played. A deck with two
four-star cards gets the same treatment as a legal one, an unfinished deck looks finished except for
a "4 of 9 positions filled" line, and the tabs and the new/delete controls run together in one row.
Deck validity also needs to be a stated rule now, so the deck picker that comes to the Battle screen
later has one thing to check.

## What Changes

- **Single-line screen header.** A new shared primitive: a screen's title set on one line between
  ornamental rules. It never wraps or stacks an eyebrow or tagline, so it takes up as little height
  as a header can. The Cards page uses it in place of its own `page-head`, and the style guide shows
  it.
- **Deck standing.** Each deck now has a *standing* worked out from its contents. Nothing new is
  stored.
  - **Invalid**: the deck holds more than one card of four stars or more. This is a hard error.
  - **Incomplete**: the deck holds fewer than nine cards. This is a soft warning.
  - **Ready**: the deck is neither invalid nor incomplete.
  - A deck can be invalid and incomplete at the same time, and both problems are reported.
- **Battle eligibility, as a rule only.** Only a Ready deck is eligible for battle. This change
  states the rule and puts a single predicate in the model. The Battle screen has no deck picker yet,
  and that screen is not changed here.
- **Building past the rarity limit is allowed.** Adding a second four-star card is not refused, as
  a full deck or an unowned card would be. The deck becomes Invalid, and the page says why.
- **The standing is stated on the Cards page.** The selected deck's problems appear below its
  positions in plain words: Invalid as a red error, Incomplete as a yellow warning that is visibly
  softer than the error. Neither relies on colour alone.
- **BREAKING (spec/test):** the "N of 9 positions filled" text is removed. The requirements and
  scenarios that asserted it now assert the standing message instead.
- **Deck tabs:** only the selected tab shows the full name `Deck N`. Unselected tabs show just the
  numeral. Every tab's accessible name is still `Deck N`.
- **Deck controls:** "New deck" becomes a **+** icon button and "Delete Deck N" becomes a
  **trash can** icon button. Both keep their accessible names. Both sit in their own group, clearly
  set apart from the tab strip.
- **Tokens:** two new semantic status colours, *warning* (yellow) and *error* (red). Both are named
  roles separate from gold (ornament) and crimson (opponent).

## Capabilities

### New Capabilities

None. Every behaviour lands in an existing capability.

### Modified Capabilities

- `user/decks`: adds deck standing (invalid / incomplete / ready), the rarity limit and how it is
  stated, that the rarity limit does not refuse an addition, and battle eligibility.
- `collection`: adds the single-line header, the standing message, and the set-apart icon controls.
  It also modifies the tab labelling, and removes the filled-count statement from the nine-positions,
  add, and remove requirements.
- `design-system/primitives`: adds the single-line screen header primitive.
- `design-system/tokens`: the semantic colour roles requirement gains the warning and error status
  roles.
- `design-system/style-guide`: primitive coverage now includes the single-line screen header.

## Impact

- **Model:** `src/model/deck.ts` gains the standing evaluation, the rarity-limit constants, and
  `isBattleReady`. It has unit tests in `src/model/deck.spec.ts`.
- **Components:** `src/components/deck-bar/` covers the tabs, the icon controls, the separation, and
  the standing message in place of the count. `src/components/collection/` swaps in the header. A
  new header primitive goes in `src/styles/primitives.css`, possibly with a small component.
  `src/components/style-guide/` gets a header example.
- **Tokens:** `src/styles/tokens.css` gets the warning and error roles.
- **Tests:** `e2e/helpers.ts` (`filledCount` reads `.count`, which is going away) and
  `e2e/cards.spec.ts` (the `'+ New deck'` role names, the filled-count assertions, and the tab
  labels) need updating. `e2e/reduced-motion.spec.ts` uses `'+ New deck'`.
- **No change:** persistence or the stored user shape, the Battle screen, game rules, and the deal.
