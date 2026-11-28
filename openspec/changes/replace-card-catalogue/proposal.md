## Why

The card catalogue has been redrawn by hand as `NEW_CARD_DB` in `src/model/card.ts`: 43 Forgotten
Crossroads cards with rebalanced stats and arrows, new five- and six-star cards, and a new numbering.
It sits beside the 15-card `CARD_DB` the application actually reads, so none of it is playable yet.
It should become the catalogue.

## What Changes

- `NEW_CARD_DB`'s 43 cards become `CARD_DB`; the old 15-card list and the `NEW_CARD_DB` name are
  removed. Every consumer (`CARD_BY_KEY`, the Collection, the Shop's packs, the opponent's random
  deck, the style guide) reads the new cards with no change of its own.
- Card #34's name is corrected from `Cornifer (Forgotten Crossrodas)` to
  `Cornifer (Forgotten Crossroads)`. Every other card is copied exactly as entered, including the
  placeholder ability text (`None`, `To be added`) and the `tbd.png` artwork.
- **BREAKING (saved data)**: the new catalogue renumbers the cards that existed before. `FC#2` was
  Gruz Mother and is now Tiktik; `FC#6` was Goam and is now Gruz Mother; and so on. Because a save
  stores cards by set and number, an old save read naively would silently hold different cards. The
  schema version rises from 5 to 6, and a record written at version 1–5 has each card renumbered to
  the new card of the same name — collection and decks alike — so a player keeps exactly the cards
  they had. All 15 old cards exist in the new catalogue by name.
- The starter set names the same nine one-star cards as before (Crawlid, Vengefly, Gruzzer, Tiktik,
  Aspid Hatchling, Wandering Husk, Husk Hornhead, Leaping Husk, Husk Bully), at their new numbers.
- The catalogue now holds five- and six-star cards for the first time. Rules that already govern
  them — pack odds for rarities 5 and 6, the rarity limit, the hidden rarity 6 rate — start to apply
  to real cards. Their rules are unchanged; only tests that assumed "no card above four stars" or
  "Goam is the four-star card" are restated.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `user/persistence`: a record written before the catalogue was renumbered is translated to the new
  numbering on load and rewritten at the current version.

## Impact

- `src/model/card.ts` — the catalogue swap and the typo fix.
- `src/model/user.ts` — new starter keys, `SCHEMA_VERSION` 6, and the version 1–5 renumbering table
  applied in `parsePersistedUser`.
- Unit tests across `src/` that look cards up by number (`FC#6` as "the four-star Goam", `FC#2` as
  "the three-star Gruz Mother", the catalogue size of 15, "no card above four stars" in the pack
  renormalization test) and the upgrade tests in `user-store.spec.ts`.
- `e2e/` fixtures that write stored records (`storeUser` writes version 5, `STARTER_REFS`, `GOAM`,
  and other numbered refs), and the seeded-match seeds, whose opponent deal draws from the catalogue.
- Players' existing saves: upgraded in place, never discarded. Goam drops from four stars to three,
  so a held Goam no longer counts toward the rarity limit; no held card becomes rarer.
