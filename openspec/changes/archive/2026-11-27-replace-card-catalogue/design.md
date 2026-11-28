## Context

`src/model/card.ts` holds two lists: `CARD_DB` (15 cards, the one every consumer reads) and
`NEW_CARD_DB` (43 cards, hand-entered, read by nothing). Every card in `NEW_CARD_DB` already passes
the `Card` constructor, and its numbers are unique, so the list is valid as it stands.

A card's identity is `set#number` (`CardKey`). Saves (`src/model/user.ts`, `PersistedUser`) store
`{ set, number }` and nothing else about a card, on purpose, so that card text can change freely.
That same choice means a *renumbering* is invisible to the loader: an old `FC#2` would load as
whatever is `FC#2` now. `parsePersistedUser` already dispatches on the stored version (1–5) and
upgrades earlier shapes; the loader rewrites any record whose read version is below
`SCHEMA_VERSION`.

Tests reach cards by number with a comment naming the card (`cardKeyOf('FC', 6) // four stars`),
and e2e writes stored records directly at version 5 (`e2e/helpers.ts` `storeUser`, `STARTER_REFS`).

## Goals / Non-Goals

**Goals:**

- One catalogue, named `CARD_DB`, holding exactly the 43 entered cards (with the #34 typo fixed).
- Old saves keep the same cards by name, per `specs/user/persistence`.
- The renumbering table guards itself: a later edit that moves one of those cards fails at load.

**Non-Goals:**

- Writing ability text or artwork for the new cards. `None`, `To be added`, and `tbd.png` ship as
  entered.
- Rebalancing pack odds, the rarity limit, or prices for a catalogue that now reaches six stars.
- A general "renumber by name" mechanism for future catalogue edits. This is one stated table for
  one historical renumbering.

## Decisions

### Swap in place, keep the name `CARD_DB`

Delete the old 15-card array, rename `NEW_CARD_DB` to `CARD_DB`. Keep its type `Card[]` (mutable):
`src/testing/six-star.ts` pushes into and splices it. No consumer changes. *Alternative:* point
`CARD_DB = NEW_CARD_DB` and keep both names — rejected, it leaves a dead alias and two names for one
thing.

### The renumbering is a stated table in `user.ts`, applied in `parsePersistedUser`

A frozen list of `{ from, name, to }` for the 15 first-catalogue cards (the table in the spec),
beside the other version constants. `SCHEMA_VERSION` becomes 6; a new
`VERSION_BEFORE_RENUMBERING = 5` joins the recognised versions, and every version ≤ 5 translates.

The translation happens inside `parsePersistedUser`, as each `PersistedEntry` and
`PersistedCardRef` is read: a first-catalogue `FC` number maps to its current number, and one with
no entry is dropped (it named no card even then). So `PersistedUser` always speaks the current
numbering, and `fromPersisted` — with its unknown-card, copy-limit, and deck-limit rules — is
untouched and judges translated cards, as the spec requires. `version` still reports the version
read, so the existing rewrite-on-upgrade path writes the record back at 6.

*Why a table and not a name lookup:* the old catalogue is being deleted, so nothing at runtime knows
what `FC#2` used to be called. The table is the only place that fact survives. *Why `name` in it:*
an assertion at module load (beside `assertStarterSet`) checks `CARD_BY_KEY.get(to).name === name`
for every row and that the `to` values are distinct. If anyone later renumbers one of these cards
again without a new schema version, the app fails at start instead of silently corrupting saves.

*Alternative:* translate in `fromPersisted` — rejected, `fromPersisted` doesn't receive the
version, and the translation is a property of the stored shape, which is `parsePersistedUser`'s job.

### Starter set keeps its nine cards, at their new numbers

`STARTER_CARD_KEYS` becomes `FC#1, 3, 5, 2, 9, 11, 12, 13, 14` (Crawlid, Vengefly, Gruzzer, Tiktik,
Aspid Hatchling, Wandering Husk, Husk Hornhead, Leaping Husk, Husk Bully) — same names, same
order. They are all still one-star. The doc comment's "exactly the one-star cards today" becomes
false (the new catalogue has more one-star cards) and is reworded; the set stays stated.

### Tests: renumber the lookups, re-pick stand-ins whose rarity moved

Mechanical: each `cardKeyOf('FC', n)` and e2e `{ set: 'FC', number: n }` that names one of the old
15 cards changes `n` per the table, keeping its comment. Where a test used a card *as* a rarity
stand-in and the card's rarity changed, pick a new stand-in. The only such case is Goam (★4 → ★3):
tests using Goam as "the four-star card" switch to False Knight (`FC#17`, ★4). Tests that find
cards by rarity (`CARD_DB.find(c => c.stars === 4)`) need nothing.

Specific restatements:

- `card.spec.ts`: catalogue size 15 → 43; `FC#7` is Aspid Hunter.
- `pack.spec.ts` renormalization: its premise "the catalogue holds no five- or six-star card" no
  longer holds of `CARD_DB`. Run the same test against `CARD_DB` filtered to ≤ 4 stars, keeping its
  effective-odds table, so it still tests redistribution.
- `user-store.spec.ts` / `user.spec.ts` upgrade tests: records at versions 1–5 now assert the
  translated cards; add tests for the spec's scenarios (version 6 is untranslated, an
  untranslatable number is dropped, no double translation).
- `src/testing/six-star.ts`: still useful (an isolated six-star card at `FC#900`); its "no real
  card has six stars yet" comment is corrected.
- `e2e/helpers.ts` `storeUser` writes version 6, so every e2e fixture states current numbers.

### Seeded e2e matches are re-found if they drift

The opponent's deck is drawn from `CARD_DB`, so a seed's match changes with the catalogue. If
`combat.spec.ts` or `reduced-motion.spec.ts` no longer reach their combat, find new seeds offline
in a throwaway Vitest spec replaying `playUntil` against `GameService`, as before.

## Risks / Trade-offs

- [A renumbered card's stats and rarity also changed, so a migrated player's deck can change
  standing — e.g. a deck that was Invalid for three Goams becomes valid] → Accepted; the spec
  guarantees the same *cards*, not the same balance. No card got rarer, so no deck becomes
  newly Invalid.
- [A stored `rarestHeld` of 4 from a Goam outlives the Goam's demotion] → Accepted; milestones
  never fall by design, and 4 reveals nothing (only 6 does).
- [Many cards show `tbd.png` and placeholder ability text] → As entered; out of scope.
- [The Collection and Decks pages now hold 43 cards rather than 15] → The existing e2e layout
  checks (viewport fit, tile geometry) run against the full catalogue and will catch it.
- [The Shop can now draw five- and six-star cards] → Intended; the pack rules always weighted them.

## Migration Plan

Players' saves upgrade on first load after deploy and are rewritten at version 6. Rolling back to a
build that knows only versions 1–5 would read a version 6 record as unrecognised and seed a fresh
user, so a rollback costs migrated players their progress. No rollback is planned.
