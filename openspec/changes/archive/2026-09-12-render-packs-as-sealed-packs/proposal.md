## Why

A pack in the Shop is currently a bare region poster on the void — it reads as a framed print, not as
something sealed that holds five cards, so the storefront's central object never looks like the thing
being bought. At the same time Geo is spelled out in words next to every number (`500 GEO`), which is
wordier than a currency needs to be now that a Geo icon exists in the repo, and the buy control says
`Buy` while the price sits separately above it, so the player reads two things to learn one.

## What Changes

- **A sealed pack replaces the bare poster.** The three wares render as foil card packs: crimped top
  and bottom edges, a foil sheen across the face, a gold seam and trim, and the region poster as the
  wrapper art. The tier name moves off the page and **onto the wrapper**, printed over the art at the
  top of the pack, where a real pack prints its set name.
- **The opening starts on the sealed pack.** Buying a pack now shows that same wrapper, which tears
  open before the five cards begin to reveal. The existing common-to-rare reveal, skip, and summary
  are unchanged after the tear.
- **Geo is always an amount followed by its icon.** `/images/geo.png` becomes the currency mark, and
  every Geo amount in the application — the purse, prices, the buy control, the development grant —
  renders as `500 ⬤` through one shared primitive. The word "Geo" no longer appears beside a number;
  the icon carries the accessible name so assistive technology still hears "500 Geo".
- **The buy control is the price.** The separate `Buy` button and the price line above it collapse
  into a single button whose label is the cost (`100 ⬤`). An unaffordable pack keeps its current
  treatment: no control at all, and the reason on the ware's face.
- The three tiers keep the shared Forgotten Crossroads poster — assigning a poster per tier is left
  for a later change.

## Capabilities

### New Capabilities

- `design-system/pack`: the sealed pack as a rendered object — its aspect, wrapper structure, crimped
  edges, foil sheen, gold trim, the printed tier name, its minimum supported width, and the torn-open
  state the opening uses. The pack's visual contract, the way `design-system/card` is the card's.

### Modified Capabilities

- `design-system/primitives`: adds the Geo amount as a shared primitive — amount followed by icon, one
  definition, used by every surface that shows Geo.
- `design-system/style-guide`: primitive coverage extends to the Geo amount and the sealed pack, so
  both are reviewable on the guide alongside the buttons and ornaments.
- `shop`: the purse and prices drop the word "Geo" for the icon; a ware is a sealed pack carrying its
  own name rather than a name above a poster; the buy control is the price; the opening begins on the
  sealed pack tearing open.

## Impact

- **Specs**: new `openspec/specs/design-system/pack/spec.md`; deltas to `design-system/primitives`,
  `design-system/style-guide`, and `shop`.
- **Code**: new `src/components/pack/` (the sealed pack renderer) and a Geo amount primitive
  (`src/styles/primitives.css` plus a small component or directive in `src/components/`);
  `src/components/shop/` (markup, styles, the buy control, and `shop.spec.ts`);
  `src/components/pack-opening/` (a sealed stage before the first reveal, its fit, and its
  reduced-motion path); `src/components/style-guide/` (two new sections).
- **Model**: `PackDefinition.art` keeps its meaning as the wrapper art; no odds, prices, or draw
  behaviour change.
- **Tests**: `e2e/shop.spec.ts` asserts against the `Geo` word and the `Buy` control today and will
  need updating; Vitest specs for the pack renderer and the Geo amount formatting.
- **Assets**: `public/images/geo.png` gains a second role as the currency mark at small sizes.
