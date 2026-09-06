## Context

See proposal.md — Why. The relevant state of the code:

- `src/model/card.ts` holds a `Card` class whose constructor is positional (`name, rarity, image?, stats?`), prefixes `/images/` onto the image filename, and merges caller-supplied stats over a `defaultStats(rarity)` result. `CardStats` nests `attack`, `defense`, and `arrows`.
- Four call sites read the model: `card.ts` (`c.rarity`, `c.stats.attack`, `c.stats.defense`, `c.stats.arrows`), `game.service.ts` (`placed.card.stats.arrows`, `.stats.attack`, `.stats.defense`), `style-guide.ts` (`c.rarity` to pick one sample per rarity), and `card.spec.ts` (constructs `Card` directly).
- The renderer currently defends itself against the model: `stars()` does `Math.max(1, Math.min(c.rarity, 7))`. That clamp exists only because the model made no promise about the range.
- There is no persistence layer, no API, and no saved player state. `CARD_DB` is the only card data in the repository, and it is authored by hand.
- Only 9 artwork files exist in `public/images/`; 6 of the 15 current cards already pass `undefined` and fall back to `crawlid.webp`.

## Goals / Non-Goals

**Goals:**
- One flat, self-describing card shape that a reader can understand without following a defaults function.
- Ranges enforced at the boundary where cards are defined, so every consumer downstream can trust them and drop its own defensive clamping.
- A catalogue-level invariant (unique set + number) checked once, not re-derived per feature.

**Non-Goals:**
- Rendering ability, set, or number — the card face is untouched apart from the field rename (see the `design-system/card` delta).
- A set registry, set totals, or collection-progress computation. `set` is a display string; a registry can come later without changing the card shape.
- Balancing the game. Attack and defense values are transcribed to preserve current gameplay feel, not retuned.
- Any migration machinery. Nothing persists cards.

## Decisions

### An options-object constructor, not positional arguments

`new Card('Crawlid', 1, 'crawlid.webp', { attack: 5, ... })` becomes `new Card({ name: 'Crawlid', stars: 1, ... })`.

Nine properties cannot be read positionally — `new Card('Crawlid', 1, 'crawlid.webp', 5, 5, ['N'], '...', 'Crossroads', 1)` is unreadable and silently wrong if two numbers are transposed. An options object makes each `CARD_DB` entry self-documenting and lets the constructor name the offending field when validation fails.

*Alternative considered:* a plain `interface Card` with object literals and no class. Rejected because validation then has nowhere to live at construction time — it would have to run as a separate catalogue pass, which catches nothing for cards built outside `CARD_DB` (tests, future pack generation, a deck editor).

### Validation throws in the constructor

Every constraint in the spec — required fields non-empty, `stars` 1–6, `attack`/`defense` 1–100, `number` ≥ 1, all integers, arrows within the eight directions with no duplicates — is checked in the constructor, which throws a `TypeError` naming the field and the offending value.

Card definitions are authored by hand and are static; an invalid card is a programming defect, not a runtime condition to recover from. Throwing surfaces it immediately in the failing test or at app start, rather than rendering a card with a nonsense bar. This is what lets `CardComponent` delete its 1–7 clamp: the range is now a guarantee, not a hope.

*Alternative considered:* clamping to the valid range instead of throwing. Rejected — it hides authoring mistakes, and it is exactly the behavior being removed from the renderer.

*Alternative considered:* branded types or a validation library (zod). Rejected as disproportionate; there are no external inputs to parse, and the project has no such dependency.

### Uniqueness is a catalogue-level check, not a per-card one

`stars`, `attack`, `defense`, and the rest are checkable by a card alone; "no two cards share a set and number" is not. A module-level assertion runs once over `CARD_DB` after it is built and throws on a collision, naming the set and number.

*Alternative considered:* a registry that cards self-register into. Rejected — it introduces construction-order coupling for one invariant over a static array.

### `Direction` stays a string-literal union, with a canonical ordered constant

`Direction` remains `'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW'`. The model exports `DIRECTIONS`, the canonical array of all eight, which the constructor validates against and which `CardComponent` uses in place of its own local copy — the component currently declares its own `DIRECTIONS` list in reading order (`NW, N, NE, W, E, SW, S, SE`) for its 3×3 grid.

The component keeps its own grid-order list, since that order is a layout concern, but membership validation comes from the model's constant so the two cannot drift apart on *which* directions exist.

*Alternative considered:* a TypeScript enum. Rejected — string literals stay readable in `CARD_DB` entries and in test assertions.

### Arrows are stored as a frozen array, and possession is asked, not scanned

The constructor rejects duplicates and freezes the resulting array. Cards are shared by reference — `open-pack` pushes the same `CARD_DB` entry into a hand several times, and `game.service` copies `PlacedCard` wrappers but never the card — so a mutable arrow array on a shared card is a real hazard.

A `hasArrow(dir)` method on the card gives `CardComponent.hasArrow` and `game.service`'s battle loop one shared answer instead of two `includes` calls.

*Assumption recorded:* a card with zero arrows is permitted by the model. It can never capture, so it is a degenerate but not incoherent card; forbidding it would be a game-balance rule, and no card in the catalogue has an empty arrow set.

### `image` keeps the `/images/` prefix in the constructor

The current constructor prepends `/images/` to a bare filename. That is retained: `CARD_DB` entries stay short, and the one place that knows where artwork lives stays one place. Unlike today, the filename is required — no `undefined` fallback to `crawlid.webp`, because six cards silently sharing a Crawlid's portrait is precisely the kind of hidden default this change removes.

Nine cards have no artwork of their own. They name `crawlid.webp` explicitly, the same file the old fallback reached for, so the borrowing is visible in the data rather than implied by an omitted argument — and a later art pass is a one-line edit per card. No new image file is added by this change.

### The catalogue becomes one set, numbered in order

All 15 cards are assigned to a single set with sequential numbers 1–15. A second set can be added later without touching the shape.

*Assumption recorded:* the set is named **Forgotten Crossroads**, matching the Hollow Knight region the current roster (Crawlid, Gruzzer, Tiktik, Vengefly, Husks, Gruz Mother) is drawn from. Numbering follows the order cards appear in the current `CARD_DB`. Both are data choices, changeable in one file without any spec impact.

### Ability text is authored per card, in-theme

Every card needs non-empty ability text and none exists today, so all 15 are written as part of this change: one or two sentences in the Hollow Knight register describing what the creature does. Nothing reads the text yet — no ability is executed by the game rules — so the text is descriptive, not a rules engine input.

*Assumption recorded:* ability text is prose, not a structured effect. Making it structured now would be designing a rules system no feature has asked for.

## Risks / Trade-offs

- **A throwing constructor turns a bad card definition into an app-start crash.** → The catalogue is static and covered by tests; a bad definition fails in CI, not in front of a player. The alternative — a silently clamped card — is worse and is what this change removes.
- **`card.spec.ts` constructs cards positionally in several places and will not compile.** → The test file is updated as part of the change; a small factory helper in the spec keeps each test stating only the fields it cares about.
- **Ability text for 15 cards is authored content, and quality varies with attention.** → Written in one pass against a consistent voice, and reviewed as a set rather than card by card. Nothing renders it yet, so a later pass costs nothing.
- **Removing the image fallback makes every card's artwork explicit, exposing that nine cards share one placeholder.** → That is the intent; the sharing is visible in the data. If a placeholder should look different from a real Crawlid, that is a follow-up art task, not a model concern.
- **`stars` capped at 6 while the renderer previously allowed 7.** → No card exceeds 4 today, so nothing in the catalogue is affected, and the style guide's rating-spanning sample row keeps working off whatever ratings exist.

## Migration Plan

There is nothing to migrate — no persistence, no API, no saved player state. The change is a compile-time break confined to five files, landed in one commit:

1. Rewrite `src/model/card.ts` (shape, validation, `DIRECTIONS`, `hasArrow`, catalogue check, rebuilt `CARD_DB`).
2. Fix the four call sites the compiler flags.
3. `ng build` and `ng test` must both pass; the card component's existing look-and-feel tests are the regression net for the renderer.

Rollback is `git revert` of that commit.
