## Why

Five defects and shifts of intent have surfaced in the card face now that it is rendering real cards:

- The `AT` / `DE` label capsules sit at the left edge of their bars, so on a low stat the capsule covers the entire fill and the value cannot be read at all — exactly the case where the reader most needs to see how little fill there is.
- The ability section is delineated only by a top rule, so its text floats against the frame instead of reading as a contained box like the other three sections.
- Card names are truncated with an ellipsis when they do not fit. A card's name is its identity; a card that reads `The Hollow Knig…` has failed to present itself.
- The set plate spells out `Forgotten Crossroads`, which crowds the collector number and competes with the ability text at the very size the plate is meant to be quiet.
- The frame's metal is coloured by rarity. That colour channel is needed for something else: in play the border will read red or blue for whoever currently holds the card, and a rarity-tinted frame would fight it.

## What Changes

- Reposition the stat labels so both the label and the bar's fill are readable at every value from 1 to 100. Neither the label may hide the fill nor the fill hide the label.
- Give the ability section a border on all sides, so it reads as its own enclosed box within the face.
- Fit the card's name instead of truncating it: a default size, shrunk in steps as the name gets longer, wrapping to a second line only when the smallest step still will not fit on one. No name is ever clipped or ellipsised.
- **BREAKING (data)** Rename the card set from `Forgotten Crossroads` to `FC` in `CARD_DB`. The set is a plain display string on the model; the short form becomes the set's actual name rather than an abbreviation the face derives.
- **BREAKING (spec)** Remove the rarity frame treatment entirely. Every card frames in one neutral material regardless of star rating; rarity is carried by the star track alone, which already states it independently.
- Hand the frame's colour to ownership: the border reads as the player's or the opponent's while a card is held, and neutral when no owner applies.

Out of scope: the ownership colours themselves are not being redesigned here — the existing player/opponent treatment simply becomes the frame's only colour channel. The in-game screen's own layout is untouched.

## Capabilities

### New Capabilities

None. Every change refines an existing rendering contract.

### Modified Capabilities

- `design-system/card`: stat labels must stay readable alongside their fill at any value; the ability section is an enclosed box; the card name is fitted rather than truncated; the rarity frame requirement is removed and the frame's colour becomes ownership's channel.
- `design-system/style-guide`: the rarity section demonstrates star tracks only — there is no longer a per-rarity frame treatment to compare side by side.

The set rename is data, not behaviour: no spec names the value of a card's set, and `cards/data-model` only requires that a set exist and that set + number identify a card uniquely. `FC` satisfies that as `Forgotten Crossroads` did, so `cards/data-model` needs no delta.

## Impact

- `src/components/card/card.css` — stat label placement, ability box border, name sizing hooks, deletion of the six `:host([data-rarity=…])` blocks and the rarity sheen, ownership border colour.
- `src/components/card/card.ts` — a computed name-size step from the name's length; `data-rarity` host binding removed.
- `src/components/card/card.html` — name section markup for the fitted name.
- `src/model/card.ts` — the `CROSSROADS` constant's value becomes `FC`.
- `src/components/card/card.spec.ts` — the truncation and rarity-attribute assertions no longer describe the card; new assertions for label/fill legibility, the ability border, and name fitting.
- `src/components/style-guide/style-guide.ts` + `.html` — the rarity gallery becomes a star-track gallery; the copy describing the frame's rarity metal is removed.
- `src/styles/tokens.css` — the `--color-rarity-*` tokens lose their only consumer.
