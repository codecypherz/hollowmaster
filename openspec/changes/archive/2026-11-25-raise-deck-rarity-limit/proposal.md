## Why

A deck may hold only one card of four stars or more, so a player who has earned a second high-rarity
card cannot take both into battle. Allowing two gives rare cards more room in a deck while still
keeping a deck from being built out of them.

## What Changes

- A deck may hold up to **two** cards of four stars or more, where it could hold one. A third makes it
  Invalid.
- Everything else about the rule is unchanged: ratings of five and six still count, two copies of one
  card count as two, adding a card over the limit is still accepted, and an Invalid deck is still
  ineligible for battle.
- The Decks page's error states the new limit, in wording that agrees with it: "only 2 are allowed",
  where the text today is fixed to the singular "is allowed".
- An existing deck holding exactly two such cards stops being Invalid. The standing is never stored,
  so no saved data changes.

**Assumption:** the request says "minimum number of allowed 4 star rarity cards". There is no minimum
today; the only value of 1 is the maximum, so this change raises that maximum. No deck is required to
hold any high-rarity card.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `user/decks`: the rarity limit allows two cards of four stars or more; the requirement stating it is
  replaced under a name that matches, and the scenarios that turn on the limit move with it.
- `decks`: the stated standing and the add action's rarity scenario follow the new limit.

## Impact

- `src/model/deck.ts`: `RARITY_LIMIT.allowed`, the one place the number is stated. The standing and
  battle eligibility read it.
- `src/components/deck-bar/deck-bar.ts`: the error's verb agreement.
- `src/model/deck.spec.ts` and `e2e/decks.spec.ts`: tests that break the limit with two cards.
- No dependency, persistence format, or migration is involved.
