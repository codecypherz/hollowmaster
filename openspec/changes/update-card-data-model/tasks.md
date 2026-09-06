## 1. The card model

- [ ] 1.1 Replace the contents of `src/model/card.ts` with the new shape: keep the `Direction` union, export a canonical `DIRECTIONS` constant of all eight, and define `Card` with the nine required properties (`name`, `arrows`, `stars`, `image`, `attack`, `defense`, `ability`, `set`, `number`). Delete `CardStats` and `defaultStats`. Verify by `npx tsc --noEmit -p tsconfig.app.json` reporting errors only at the four known call sites (`card.ts`, `card.spec.ts`, `game.service.ts`, `style-guide.ts`) and nowhere else.
- [ ] 1.2 Give `Card` an options-object constructor that prefixes `/images/` onto the supplied filename (now required, no fallback) and freezes the arrows array. Verify with a scratch test that two cards built from the same options do not share a mutable arrows array and that `card.image` is `/images/<file>`.
- [ ] 1.3 Add constructor validation that throws a `TypeError` naming the offending field for: an empty or whitespace-only `name`, `image`, `ability`, or `set`; `stars` outside 1–6 or non-integer; `attack` or `defense` outside 1–100 or non-integer; `number` below 1 or non-integer; an arrow outside the eight directions; a repeated arrow. Verify against task 3.1's tests.
- [ ] 1.4 Add a `hasArrow(dir: Direction): boolean` method to `Card`. Verify it reports true for every direction the card was built with and false for the rest.

## 2. The card catalogue

- [ ] 2.1 Rebuild `CARD_DB` with all 15 existing cards in the new shape, carrying over each card's current `attack`, `defense`, and `arrows` values verbatim and its current `rarity` as `stars`. Verify no card's attack, defense, or arrow set differs from the pre-change values (diff against git history).
- [ ] 2.2 Assign every card `set: 'Forgotten Crossroads'` and sequential `number` 1–15 in the order the cards currently appear. Verify every card has a distinct number and the sequence has no gaps.
- [ ] 2.3 Give every card non-empty ability text — one or two sentences in the Hollow Knight register describing what the creature does. Verify all 15 are written in one consistent voice and none is a placeholder string.
- [ ] 2.4 Name every card's artwork explicitly: real files for the six that have them, `crawlid.webp` for the nine that do not. Verify each referenced filename exists in `public/images/`.
- [ ] 2.5 Add a module-level assertion, run once after `CARD_DB` is built, that throws naming the set and number when two cards share both. Verify by temporarily duplicating a number and confirming the throw, then reverting.

## 3. Model tests

- [ ] 3.1 Add `src/model/card.spec.ts` covering the validation rules: boundary values accepted (`stars` 1 and 6, `attack` 1, `defense` 100, `number` 1), out-of-range and fractional values rejected, empty required fields rejected, an unknown direction rejected, a duplicate direction rejected. Verify `ng test` passes with these tests present.
- [ ] 3.2 Add tests for arrow behavior and card identity: `hasArrow` for a partial set, for all eight, and for none; a card reports its own `set` and `number`; the same `number` in two different sets is valid. Verify `ng test` passes.
- [ ] 3.3 Add a catalogue test asserting every `CARD_DB` entry satisfies the ranges and carries non-empty `name`, `image`, `ability`, and `set`, and that no two entries share a set and number. Verify `ng test` passes.

## 4. Call sites

- [ ] 4.1 Update `src/components/card/card.ts`: `c.rarity` → `c.stars`, `c.stats.attack` → `c.attack`, `c.stats.defense` → `c.defense`; delete the `Math.max(1, Math.min(c.rarity, 7))` clamp in `stars()` so the star count equals the rating exactly; delegate `hasArrow` to the card's own method; import the direction list from the model while keeping the component's grid-reading order. Verify the card component tests pass.
- [ ] 4.2 Update `src/services/game.service.ts` battle resolution to read `placed.card.arrows`, `placed.card.attack`, and `target.card.defense`. Verify a game can be played through to completion in the running app with captures still resolving.
- [ ] 4.3 Update `src/components/style-guide/style-guide.ts` so the rating-spanning sample row keys off `stars` instead of `rarity`, renaming the local `byRarity` map accordingly. Verify the style guide page renders one sample card per distinct star rating present in the catalogue.
- [ ] 4.4 Update `src/components/card/card.spec.ts` to construct cards through the options-object constructor, via a small local factory that lets each test state only the fields it asserts on. Verify every existing card component test still passes unmodified in intent.

## 5. Verification

- [ ] 5.1 Run `npx tsc --noEmit -p tsconfig.app.json` and confirm zero errors — no call site still reads `rarity` or `stats`. Cross-check with `grep -rn "\.rarity\|\.stats\." src/` returning nothing.
- [ ] 5.2 Run `ng test` and confirm the full suite passes, including the card component's look-and-feel assertions (three sections, eight chevrons, stars from the image section, no numerals on the face, proportional stat bars).
- [ ] 5.3 Run `ng build` and confirm a clean production build.
- [ ] 5.4 Load the app and check the card face is visually unchanged: open a pack, play a game, and view the style guide — confirm no ability text, set name, or collector number appears on any card, and that the three sections, chevrons, stars, and stat bars render as before.
- [ ] 5.5 Run `npx prettier --check src/model/card.ts src/model/card.spec.ts src/components/card/card.ts src/components/card/card.spec.ts src/services/game.service.ts src/components/style-guide/style-guide.ts` and confirm all files are formatted.
