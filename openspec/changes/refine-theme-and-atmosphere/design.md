## Context

See `proposal.md — Why` for motivation. The constraints that shape the approach:

- **Tokens are already the single source of truth.** `src/styles/tokens.css` declares everything in
  one `@theme static` block, so a palette pass is a value edit in one file — *except* for four
  hardcoded `rgba(4, 4, 10, …)` washes in `card.css` and `game.css` that copy the current void.
  Those are the only literals that break when the ground moves; the other ~50 literals in component
  CSS are additive glow shadows, which composite correctly over any ground.
- **Particles are a shared primitive with six consumers.** `battle`, `game`, `shop`, `collection`,
  `open-pack`, and `style-guide` each render `<span class="particle" [style.--i]="p">` over an
  index array, and each sets `--particle-gap` / `--particle-stagger` in its own CSS. Any change to
  the particle contract touches all six.
- **`--dur-entrance` has exactly one consumer** (`battle.css`), so shortening it is safe and local.
- **The style guide enumerates `:root` at runtime**, so new tokens appear in it with no edit — but
  its atmosphere demo hardcodes a `[0..11]` array in the template and will need the generator.
- **No SSR.** `main.ts` bootstraps in the browser only, so generated randomness cannot cause a
  hydration mismatch. Determinism is wanted for testability, not correctness.
- **Look-and-feel constraints in `CLAUDE.md`** govern card aspect ratio, board tile sizing, and
  on-screen fit. This change touches colour and motion only; no geometry moves.

## Goals / Non-Goals

**Goals:**

- A palette lift that changes *value and temperature*, not identity — the same theme, lit.
- A particle field whose structure is not perceptible, at the same element count as today.
- A Battle screen that arrives lit and settles in about a second.
- Every new behaviour expressed through tokens and one shared primitive, so the six particle
  surfaces stay identical by construction.

**Non-Goals:**

- Canvas or WebGL particles. The field is ambient decoration at 14–22 elements; a render loop would
  cost more than it buys and would not survive `prefers-reduced-motion` as gracefully.
- A general purge of the ~50 remaining hardcoded colour literals in component CSS. They violate the
  existing tokens spec, but they composite correctly over the new ground and fixing them is a
  separate, mechanical change. Only the four ground-copy scrims are in scope.
- Entrance choreography for Shop, Cards, or the in-game screen; route transition animation.

## Decisions

### 1. Lift the ground into a cool blue-grey, and lift the text ramp with it

Hollow Knight's darkness is *lit* — desaturated blue-grey, never absent of light. The current
`#04040a` void is effectively black, which flattens the atmosphere layers into one another and
leaves the text ramp with almost nothing to sit on.

Target values (hue family preserved throughout; this is a value/temperature pass):

| Token | Now | Proposed |
| --- | --- | --- |
| `--color-void` | `#04040a` | `#0c1018` |
| `--color-deep` | `#08081a` | `#141b2e` |
| `--color-nebula-core` | `#0f1535` | `#1b2450` |
| `--color-nebula-low` | `#0a0e28` | `#141c3c` |
| `--color-nebula-high` | `#0a0e25` | `#141a38` |
| `--color-mist-low` | `rgba(12,20,55,.9)` | `rgba(26,38,78,.85)` |
| `--color-mist-high` | `rgba(8,14,40,.6)` | `rgba(20,30,66,.55)` |
| `--color-surface` | `#06071a` | `#0f1424` |
| `--color-card-bg` | `#06091c` | `#101526` |
| `--color-card-face` | `#02020a` | `#080b14` |
| `--color-card-art` | `#070a1a` | `#111726` |
| `--color-card-back` | `#080c1e` | `#121829` |
| `--color-cell-bg` | `#0e1025` | `#161d33` |
| `--color-cell-border` | `#3a3e80` | `#4a5296` |
| `--color-soul` | `#c4dcff` | `#cfe6fb` |
| `--color-soul-bright` | `#d8e8ff` | `#e6f4ff` |
| `--color-soul-dim` | `#6080cc` | `#7a9ad8` |
| `--color-gold` | `#e09030` | `#e8a03c` |
| `--color-gold-light` | `#f8c040` | `#ffcc58` |
| `--color-gold-dim` | `#8a5818` | `#a06c24` |
| `--color-gold-shimmer` | `#f0c464` | `#ffd782` |
| `--color-crimson` | `#e03838` | `#ec4a44` |
| `--color-crimson-dim` | `#9a2020` | `#b02c2c` |
| `--color-text-dim` | `#4a5888` | `#6b7cae` |
| `--color-text-muted` | `#7888b8` | `#93a4d0` |
| `--color-text-bright` | `#a8bce8` | `#c4d6f5` |

Two things this buys beyond mood. First, `--color-gold-dim` is the border of every corner bracket,
button, and the nav rule — lifting it brightens the whole chrome without touching a single
component. Second, contrast improves rather than degrades:

| Pairing | Now | Proposed |
| --- | --- | --- |
| `text-dim` on void | ≈ 2.9 : 1 (fails AA) | ≈ 4.6 : 1 (passes AA) |
| `text-muted` on void | ≈ 5.8 : 1 | ≈ 7.7 : 1 |
| `text-bright` on void | ≈ 10.0 : 1 | ≈ 12.9 : 1 |

`text-dim` currently fails AA and is used for the Battle eyebrow and several labels; the lift fixes
that as a side effect, which is why the spec pins a contrast floor rather than only a hue range.

*Alternative considered:* shifting soul toward true cyan (`#d0f0f0`, the lumafly reading). Rejected
as too far from the established look — the nudge to `#cfe6fb` keeps the blue identity while picking
up the cooler cast.

### 2. A scrim token derived from the ground

Add `--color-scrim: color-mix(in srgb, var(--color-void) 92%, transparent)` and route the four
`rgba(4, 4, 10, …)` washes through it (`card.css` name band and stat band, `game.css` overlay). The
derivation is the point: a wash stated as a literal is exactly what left these four black against a
moved ground.

*Fallback:* if `color-mix` inside `@theme` proves awkward under Tailwind's token emission, declare
the scrim as a literal `rgba(12, 16, 24, 0.92)` in the same block, with a comment tying it to void.
The spec's requirement is that the scrim tracks the ground, which either form satisfies as long as
they change together.

### 3. Entrance pace as tokens; elements declare position, not time

- `--dur-entrance: 1s → 0.5s`
- new `--dur-stagger: 0.09s`

`.fade-in` derives its delay from an index:

```css
.fade-in {
  animation: fadeInUp var(--dur-entrance) calc(var(--n, 0) * var(--dur-stagger))
    var(--ease-out-soft) both;
}
```

Markup carries `style="--n: 0"` … `--n: 6` for ornament, eyebrow, HOLLOW, MASTER, tagline,
ornament, nav. The last element settles at `6 × 0.09 + 0.5 ≈ 1.04s`, down from 2.7s, and changing
the screen's pace is now one token rather than seven inline literals.

`fadeInUp`'s travel drops `18px → 12px`: at half the duration the longer throw reads as a jerk.

*Alternative considered:* keeping literal `--delay` values and just shrinking them. Rejected —
seven magic numbers that must be kept in proportion by hand is exactly what the `tokens` spec
exists to prevent, and the spec now has a scenario for it.

### 4. The glow pop: give the title a resting glow and make the loop start there

Root cause: `.title-hollow` and `.title-master` declare no `text-shadow`. Their glow exists only
inside `soulFlicker` / `goldShimmer`, which are delayed by `calc(var(--delay) + 1s)` — landing
exactly as the entrance settles — and whose `0%` keyframe is *full* intensity. So the title fades in
unlit, holds, and then the glow snaps on. That is the lightbulb.

Fix, in three parts:

1. Hoist the resting ramp to a local custom property and apply it statically:
   `.title-hollow { --glow-rest: 0 0 25px …, 0 0 55px …, 0 0 110px …; text-shadow: var(--glow-rest); }`
   The glow is now part of the element, so it fades in *with* the letterforms — element `opacity`
   attenuates `text-shadow` along with the glyphs, so the entrance handles it for free.
2. Rewrite the keyframes so `0%`/`100%` read `text-shadow: var(--glow-rest)`. The loop now opens on
   the value already on screen, and closes on it too — continuous at the seam in both directions.
3. Drop the `+ 1s` offset. With `0%` equal to rest there is nothing to hide, and flicker and
   entrance animate disjoint properties (`text-shadow` vs `opacity`/`transform`), so they compose.

`goldShimmer` gets the same treatment: its `0%`/`100%` currently set `color` with *no* shadow, so
the title also loses its gold halo once per cycle. Both stops become `color: var(--color-gold-light);
text-shadow: var(--glow-rest)`.

### 5. Rebuild the particle field: seeded generation + depth as one scalar

**Generation** — a new `src/model/particle.ts`:

```ts
export interface Particle {
  x: number;  y: number;   // % across / up the surface (y used only at rest)
  depth: number;           // 0 = far, 1 = near
  size: number; alpha: number; blur: number;   // depth-derived appearance
  rise: number; offset: number;                // s; offset is negative
  sway: number; swayDur: number; swayDelay: number;
  twinkleDur: number;
  falling: boolean;
}

export function createParticleField(count: number, seed: number): Particle[];
export function particleVars(p: Particle): Record<string, string>;
```

A `mulberry32` PRNG keyed by an explicit seed. Each surface passes its own literal seed, so fields
differ between screens but never between renders of the same screen — which is what makes the field
assertable in a unit test rather than only by eye.

Four choices inside the generator carry the "sophisticated" requirement:

- **Stratified horizontal jitter**, not uniform random: `x = (i + rand()) / count * 100`. At
  n = 14–22, pure random leaves visible clumps and bald patches; stratification guarantees coverage
  while destroying the grid. This directly replaces `left: calc(var(--i) * var(--particle-gap))`.
- **Depth as a single scalar driving four properties.** `depth = rand() ** 1.6` (biased far, so most
  particles are small and dim and a few read as close). Then `size = lerp(1, 4, d)px`,
  `alpha = lerp(.25, .95, d)`, `blur = lerp(1.2, 0, d)px`, `rise = lerp(26, 11, d)s`. One scalar
  keeps the cues coherent — near particles are never also slow or blurry — which is what makes the
  field read as a volume instead of noise. This is the spec's "depth cues do not contradict".
- **Sway decorrelated from rise.** `swayDur = 4.5 + rand() * 5` is deliberately unrelated to `rise`,
  so a particle's lateral phase never lines up with its vertical one and no path visibly repeats.
- **Negative offsets.** `offset = -rand() * rise` starts every particle mid-flight, so the field is
  fully populated on the first frame instead of taking ~8s to fill. This is the single biggest
  contributor to navigation feeling smoother: today, arriving at any page shows an airless screen.

Plus a **dust-mote minority**: `falling = rand() < 0.18`, dimmed and slowed, drifting *down* rather
than up — the ash-and-dust reading of the Crossroads rather than pure soul-ascension.

**Rendering** — the sway cannot ride the same element as the rise, since two animations on one
element cannot both write `transform`. Rather than nest a wrapper element (six templates would gain
a level), the particle element carries the rise and its `::after` carries sway and twinkle:

```css
.particle {                     /* the travelling box: transform + life envelope */
  left: calc(var(--x) * 1%);
  width: var(--size); height: var(--size);
  animation: particleRise var(--rise) var(--offset) linear infinite;
}
.particle::after {              /* the visible dot: lateral drift + twinkle */
  content: ''; inset: 0; border-radius: 50%;
  background: var(--color-soul);
  box-shadow: 0 0 calc(var(--size) * 2.5) calc(var(--size) * .8) var(--color-soul-glow);
  filter: blur(var(--blur));
  opacity: var(--alpha);
  animation:
    particleSway var(--sway-dur) var(--sway-delay) ease-in-out infinite alternate,
    particleTwinkle var(--twinkle-dur) ease-in-out infinite;
}
```

Parent opacity (life envelope) multiplies child opacity (twinkle), which is exactly the wanted
composition. Only `transform` and `opacity` animate, so the field stays on the compositor.

Templates bind one object rather than ten properties: `[style]="vars(p)"`, with `particleVars`
producing the `--x` / `--size` / `--alpha` / … map. The `.falls` class marks the mote minority.

**Per-screen density** collapses to the count each component already passes; the
`--particle-gap` and `--particle-stagger` declarations are deleted from all five component
stylesheets that set them. This is what the spec's "a screen states only how many particles it
wants" pins down.

**Reduced motion** rests the field at its generated `x`/`y` with animations off, so it stays a
scattered field with its varied sizes and brightnesses rather than the current behaviour of
re-deriving position from `--i` into an even column.

*Alternative considered:* keeping the index-driven CSS and adding more `nth-child` variation.
Rejected — `nth-child` variation *is* a repeating pattern, which is the defect.

## Risks / Trade-offs

- **A brighter ground weakens glow contrast** → accent brightness is lifted in the same pass, and
  the style guide renders every token and primitive on one page for a side-by-side check before the
  change is called done.
- **`color-mix` inside Tailwind's `@theme` may not emit cleanly** → fall back to a literal scrim in
  the same block with a comment binding it to void; the requirement is that the two move together.
- **The ~50 remaining hardcoded literals are left in place** → they are additive glow shadows and
  composite correctly over the new ground; the four that copy the ground are fixed. Recorded as
  pre-existing debt against the tokens spec's "no hardcoded themed values" scenario.
- **`filter: blur()` promotes each far particle to its own layer** → blur is capped at 1.2px and
  applied only to the far end; at 14–22 elements per screen the cost is negligible, and the
  compositor-only property set keeps the main thread free.
- **Six templates change at once** → the particle contract is exercised by the style guide, which
  renders the field alongside every other primitive, so a missed conversion is visible in one place.
- **Palette values are a judgement call** → they are listed explicitly above so they can be argued
  with as numbers rather than adjectives, and the spec constrains the *properties* (lit range, layer
  ordering, contrast floor) rather than the exact hexes, so tuning does not require a spec change.

## Migration Plan

Front-end only: no data, no API, no route, no dependency changes. Ship as one commit; rollback is a
revert. Tokens land first so the palette can be reviewed on the style guide before the particle and
Battle work is layered on top.
