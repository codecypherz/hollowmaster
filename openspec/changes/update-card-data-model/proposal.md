## Why

The current `Card` model was a first sketch: it carries a `rarity` number with no defined ceiling, buries `attack`/`defense`/`arrows` inside a nested `stats` object, and derives stats from rarity through a default function that quietly overwrites what a card author intended. It has no notion of an ability, and no way to say which collection a card belongs to or where it sits within that collection — so the Cards page cannot show collection progress, and no card can carry rules text.

Replacing the model now, while `CARD_DB` is small and the game is the only consumer, is far cheaper than doing it after a real card catalogue exists.

## What Changes

- **BREAKING** Replace the `Card` class with a flat, fully-specified shape: `name`, `arrows`, `stars`, `image`, `attack`, `defense`, `ability`, `set`, `number`.
- **BREAKING** Rename `rarity` to `stars` and bound it to 1–6 (previously an unbounded number that renderers clamped to 7 on their own).
- **BREAKING** Flatten `CardStats` away — `attack`, `defense`, and `arrows` move onto the card itself. `card.stats.attack` becomes `card.attack`.
- **BREAKING** Remove stat derivation from rarity. Every card states its own `attack` (1–100), `defense` (1–100), and arrows; there are no defaults filled in behind the author's back.
- Add `ability`: the card's rules text, required on every card. The ability has no name — the text is the whole of it.
- Add `set` (the collection set the card belongs to, a plain display string) and `number` (its position within that set).
- Require a card's construction to be validated: out-of-range stars, attack, defense, or number, a duplicate arrow, or an empty required field is a defect the model rejects rather than renders.
- Rebuild `CARD_DB` against the new shape, assigning every card an ability, a set, and a set number, and re-stating attack/defense/arrows explicitly.
- Update the card renderer, game service, style guide, and card tests to read the flat fields.

Out of scope: the card face keeps its current three sections and does not display ability, set, or number. Those fields become available to a later change (a collection view or card detail surface).

## Capabilities

### New Capabilities
- `cards/data-model`: What a card is — its required properties, their value ranges, arrow direction set, ability text, and set/collector-number identity — independent of how any surface renders it.

### Modified Capabilities
- `design-system/card`: The "Rarity rendered as stars" requirement becomes a star-count requirement bounded at 1–6, and the renderer reads the flat card fields rather than a nested stats object.

## Impact

- `src/model/card.ts` — `Card`, `CardStats`, `Direction`, `CARD_DB` all rewritten. `CardStats` and the `defaultStats` helper are removed.
- `src/components/card/card.ts` + `card.spec.ts` — `c.rarity` → `c.stars`, `c.stats.attack` → `c.attack`, `c.stats.arrows` → `c.arrows`; the renderer's own 1–7 clamp is dropped now that the model guarantees the range.
- `src/services/game.service.ts` — battle resolution reads `card.arrows`, `card.attack`, `card.defense`.
- `src/components/style-guide/style-guide.ts` — rarity-spanning sample selection keys off `stars`.
- `src/components/open-pack/open-pack.ts` — constructs no cards itself; unaffected beyond compiling against the new type.
- No persistence, no API, and no stored player data exists yet, so there is nothing to migrate.
