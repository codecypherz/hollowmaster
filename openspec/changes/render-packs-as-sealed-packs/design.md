## Context

See `proposal.md` — Why. What shapes the approach:

- The Shop draws the ware itself: `shop.html` sets the name, then an `<img class="ware-art">` of the
  region poster, then a price line, then an `hk-btn` labelled `Buy`. There is no pack renderer.
- `PackOpening` takes only `cards` and starts revealing immediately. Its whole sequence is one signal,
  `revealedCount`, and an `effect` on it re-measures the surface for `fitOverlay()`.
- `PackDefinition.art` already carries a per-tier image path; all three tiers currently point at
  `/images/card-pack-fc.png` and keep doing so after this change.
- `public/images/geo.png` is a 360×360 RGBA PNG with transparent corners, so it can sit inline in text
  and on a button without a plate behind it.
- The card is the precedent for a rendered object: `card.css` makes the card its own named query
  container (`container: card / inline-size`) and scales every internal metric from `cqw`, so one
  renderer works from 120px to full size. The pack follows that idiom rather than inventing another.
- The design system's rule is that no screen declares a competing treatment of a shared thing — see
  the button primitive's "No screen defines its own button".

## Goals / Non-Goals

**Goals:**

- One pack renderer, built from CSS and the existing poster art — no new image assets.
- One Geo amount primitive that is impossible to use wrongly: the arrangement is inside it.
- A sealed stage in the opening that does not destabilise the overlay's existing fit-to-viewport
  measurement.

**Non-Goals:**

- Per-tier wrapper art, wrapper colour, or foil colour varying by tier — the tiers stay on the shared
  poster and differ by their printed name.
- Any change to prices, odds, the draw, the reveal order, or the purchase settlement.
- An interactive tear (drag to open, click to tear). The pack tears on its own; the only control is
  the existing Skip.
- Geo appearing anywhere it does not appear today — only the Shop shows Geo.

## Decisions

### The Geo amount is a component over global primitive classes, not a bare CSS class

`src/components/geo/geo.ts` (`<app-geo [amount]="…" />`) renders `{{ amount }}` followed by
`<img src="/images/geo.png" alt="Geo">`, using classes (`.geo-amount`, `.geo-mark`) declared in
`src/styles/primitives.css` alongside `.hk-btn` and the ornaments.

Why both halves: the classes belong in `primitives.css` because the style guide enumerates primitives
from there and because the mark's metrics are design-system values; the component exists because the
spec forbids a surface arranging amount and mark itself, and a copy-pasted two-element snippet in the
purse, three prices, three locked plates, and the grant button is exactly the drift the spec rules
out. `<app-geo>` also gives the accessible name one definition — the `alt` text — so
`<button><app-geo [amount]="100"/></button>` computes the name "100 Geo" for free.

Alternatives: a CSS class alone (rejected — cannot enforce order or the alt text); an Angular pipe
returning a string (rejected — a pipe cannot emit an image, and a text glyph for Geo does not exist).

Sizing: `.geo-mark` is `width: 1.15em; height: 1.15em; vertical-align: -0.18em`, so the mark is sized
and aligned by whatever type it sits in and the primitive needs no size input. The purse enlarges by
setting `font-size` on its own element, exactly as it does today.

### The pack is a component in its own folder, a query container like the card

`src/components/pack/pack.ts` (`<app-pack [pack]="def" [torn]="…" />`) with `pack.css` declaring
`container: pack / inline-size`, `aspect-ratio: 2.5 / 4`, and `min-width: 120px`. Every internal
metric — crimp height, trim width, name size, serration pitch — is a `clamp(px, cqw, px)` off the
pack's own width, which is what makes "ornament simplifies near the minimum" a matter of the clamp
floors rather than a second code path.

The wrapper is built from CSS on top of one `<img>`:

| Part | How |
| --- | --- |
| Face art | `<img>` with `object-fit: cover; object-position: center` — the centred crop the spec requires, and the same treatment the card's art window uses |
| Crimp bands | a `repeating-linear-gradient` stripe field for the foil ridging, with the band's outer edge serrated by a `mask-image` of repeating triangles |
| Foil sheen | an absolutely positioned skewed `linear-gradient` highlight, `mix-blend-mode: screen`, animated on `translateX`; under reduced motion the animation is removed and the highlight rests mid-face |
| Trim | a gold-dim border plus an inset shadow for depth and an outer `drop-shadow`, matching the card's layered frame |
| Name plate | absolutely positioned under the top crimp, `--font-display` uppercase and letter-spaced, over a `linear-gradient(to bottom, var(--color-scrim), transparent)` band so legibility comes from the wrapper rather than from the art |

No new tokens: the gold ramp, `--color-scrim`, the soul ramp, and the type families already cover it.

Alternatives: pre-rendering a wrapper PNG per tier (rejected — it would not scale across the size
range, could not tear, and adds assets for something CSS does well); an SVG wrapper (rejected — the
serration and sheen are cheaper as gradients and masks, and an SVG would still need the art composited
through it).

### Torn is a boolean input, drawn as a different top edge

`torn` swaps the top crimp for a ragged edge — a `clip-path` polygon with irregular points and a
darker interior showing behind it — and leaves the art, name, trim, and bottom crimp untouched, which
is what makes it read as the same wrapper after the fact. It is an input rather than internal state so
the style guide can show both, and so the opening owns the timing.

### The opening gains a stage flag, not a second driver

`PackOpening` gains a `pack` input and a `sealed` signal (`true` at open). `ngOnInit` starts a timer
for the seal dwell plus the tear, then calls the existing `advance()`; `finish()` — already the single
end state shared by Skip, reduced motion, and destruction — additionally clears `sealed`. That keeps
one way to end the sequence, which is why skipping from the sealed stage needs no new path.

The `effect` that refits the overlay reads `sealed()` as well as `revealedCount()`, so the surface is
re-measured when the pack leaves the hero slot.

**The sealed pack is laid out to the hero card's height, not its width.** A pack at the same height as
the hero card is narrower than it (2.5:4 against 2.5:3.5), so the hero slot's height never changes
between the sealed stage and the first reveal and `fitOverlay()` does not thrash. The hero slot keeps
its current height; only its occupant changes.

Timing lives beside the existing `DWELL_*` constants as `SEAL_DWELL_MS` and `TEAR_MS` (roughly 700 and
600), so the whole sequence's pace is readable in one place. The first card rises out of the torn pack
as the pack fades, which is the spec's "the cards come out of it" without the pack competing with the
card for the slot.

### The Shop's ware becomes pack + price button

`shop.html` loses `.ware-name`, `.ware-art`, and `.ware-price`; the ware becomes `<app-pack>` plus one
control. Affordable: `<button class="hk-btn" [attr.data-buy]="ware.id"><app-geo [amount]="ware.price"/></button>`.
Unaffordable: the existing `.ware-locked` plate keeps `data-locked` and its crimson-dim treatment, and
now carries `<app-geo [amount]="ware.price"/>` above its "Not enough" line — the price stays on screen
without becoming reachable, which is the spec's inert plate. The "no control at all" structure the
current code relies on for inertness is unchanged.

The hover lift moves from `.ware-art` to the pack, and the unaffordable greyscale filter with it.

`shop.ts` is unchanged apart from importing the two new components — `buy()`, `canAfford()`, and the
purchase ordering all stay as they are.

### The style guide gains two sections, hand-written like the button section

A Geo section (zero, a price, the purse amount, and one inside a button) and a pack section (the three
tiers sealed, one torn, and one at 120px). These sit with the existing hand-written primitive sections;
the token sections stay generated.

## Risks / Trade-offs

- **A CSS crimp can read as a stripe pattern rather than as foil** → the serrated `mask` on the band's
  outer edge is what sells it; verify in the browser at the storefront size and at 120px before
  calling it done, and screenshot both for review.
- **The name over arbitrary art** → the scrim band plus a text shadow is specified for legibility, but
  all three tiers currently share one poster, so the bright-art case is under-tested. The style guide's
  pack section is the place to check it against the other two posters.
- **`mix-blend-mode: screen` on the sheen can wash out a pale poster** → if it does, fall back to a
  plain alpha highlight; the sheen is a single overlay element either way.
- **Two more elements in the opening's measured surface** → the sealed stage is measured by the same
  `fitOverlay()` path as everything else; the risk is a resize jump at the tear, which the
  equal-height hero slot is chosen to avoid. Playwright covers the sealed stage at the same viewport
  sizes the reveal is already covered at.
- **The seal adds ~1.3s before the first card** → it is a cost paid on every purchase, and Skip is
  available throughout. If it reads as slow in the browser, the two constants are the only thing to
  tune.
- **Existing tests assert the old surface** → `e2e/shop.spec.ts` asserts `.purse` contains "Geo" and
  finds a `Buy` control; both assertions invert under this change and are rewritten rather than
  deleted (the purse must now *not* contain the word, and `[data-buy]` must be labelled with the
  price).
