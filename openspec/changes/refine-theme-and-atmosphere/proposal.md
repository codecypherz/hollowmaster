## Why

The theme reads as *near-black space* rather than *Hallownest*. The ground tokens sit at
`#04040a`/`#08081a` — effectively pure black — while Hollow Knight's world is a lit, cool
blue-grey gloom: dark, but never absent of light. The result is a screen that is atmospheric but
flat and slightly airless, with a text ramp pressed against a black floor.

Three concrete defects compound it:

1. **The particle field reads as a machine, not as air.** Particles are laid out on a fixed
   horizontal grid (`--i * gap`), rise on a strictly vertical path, and vary only by index. The
   column spacing and the repeating `nth-child` size pattern are visible once noticed, and the
   field starts *empty* on every page load — the stagger takes ~8s to fill the viewport, so a
   freshly navigated page has almost no atmosphere at the moment the player is looking at it.
2. **The Battle screen flashes.** `.title-hollow` and `.title-master` carry no resting
   `text-shadow`; their glow arrives only when `soulFlicker`/`goldShimmer` begin at
   `delay + 1s` — exactly as the entrance settles — and those keyframes open at full intensity.
   The title lands dark, sits for an instant, then a glow snaps on. The "lightbulb" is a
   discontinuity, not a design choice.
3. **The Battle screen is slow to become usable.** The entrance runs `0.2s → 1.7s` of staggered
   delays on top of a `1s` fade, so the Start Game button does not settle until ~2.7s after the
   route renders. It plays on every arrival at `/battle`, including every return from Shop or
   Cards, which makes ordinary navigation feel heavy.

## What Changes

- **Lift the palette toward Hollow Knight's lit gloom.** Raise the luminance of the void, deep,
  nebula, mist, and surface tokens off near-black into a cool blue-grey ground; nudge soul toward
  its cyan-white lumafly cast and gold toward lamp amber; lift the text ramp in step so contrast
  is preserved or improved. Hue families and semantic roles are unchanged — this is a value and
  temperature pass, not a repalette.
- **Add a scrim token** for the near-black wash the card bands and the game overlay currently
  paint with a hardcoded copy of the *old* void (`rgba(4, 4, 10, …)`), so they track the new
  ground instead of staying black against it.
- **Rebuild the particle field as a seeded, depth-layered drift.** Each particle gets a generated
  set of properties — jittered horizontal position, a depth scalar that drives size, brightness,
  blur and speed together, an independent lateral sway, a slow twinkle, and a negative animation
  delay so the field is already populated on first paint. A minority drift *down* as dust motes
  rather than rising. Generation is a seeded pseudo-random helper, so the field is varied but
  deterministic and testable.
- **Remove the Battle screen's glow pop.** Give the title spans their resting glow statically and
  make the ambient flicker/shimmer keyframes open and close on that exact value, so the glow is
  present through the entrance and the ambient loop joins it seamlessly.
- **Roughly halve the Battle screen's entrance.** Shorten the entrance duration and express the
  per-element stagger as an index against a single stagger token, so the whole choreography's pace
  is one value and the last element settles a little over a second in.

Not in scope: adding entrance choreography to Shop, Cards, or the in-game screen; route transition
animations; any change to card, board, or layout geometry.

## Capabilities

### New Capabilities

- `battle`: The Battle (title) screen's presentation — its title treatment, its ambient glow, and
  the entrance choreography that introduces it. Today only its *route* is specified (under
  `navigation/routing`); nothing captures how it must appear or how quickly it must become usable,
  which is why both defects above were invisible to the specs.

### Modified Capabilities

- `design-system/tokens`: adds a requirement that the palette's ground sits in a lit blue-grey
  range rather than at black, with a contrast floor that the lift must not violate; adds motion
  tokens for entrance pace so a screen's choreography speed is a token, not a set of inline
  literals.
- `design-system/primitives`: replaces the uniform, index-derived particle behaviour with a
  requirement for a varied, non-repeating, depth-layered field that is already populated at first
  paint — and keeps its reduced-motion and non-interactive guarantees intact.

## Impact

- **Tokens** — `src/styles/tokens.css`: value changes across void/deep/nebula/mist/surface/text/
  soul/gold; new scrim and entrance-pace tokens. Every screen inherits the shift.
- **Primitives** — `src/styles/primitives.css`: `.particle` rebuilt (rise on the element, sway and
  twinkle on its pseudo-element), reduced-motion fallback updated to the new custom properties.
- **New shared helper** — a seeded particle-field generator in `src/model/`, consumed by the six
  surfaces that render particles: `battle`, `game`, `shop`, `collection`, `open-pack`,
  `style-guide`. Each replaces its `[style.--i]` binding and its `--particle-gap`/
  `--particle-stagger` parameters.
- **Battle screen** — `src/components/battle/battle.{html,css}`: resting glow, retuned keyframes,
  index-based stagger, shorter entrance.
- **Card and game scrims** — `src/components/card/card.css`, `src/components/game/game.css`: the
  three hardcoded `rgba(4, 4, 10, …)` washes routed through the new scrim token.
- **Style guide** — `src/components/style-guide/`: its atmosphere demo picks up the new field; its
  token tables pick up the new tokens automatically, since it enumerates `:root` at runtime.
- **Tests** — new unit coverage for the particle generator (determinism, spread, depth coherence);
  existing card tests are unaffected.
- No dependency, API, or routing changes.
