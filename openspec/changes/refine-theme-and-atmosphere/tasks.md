## 1. Palette lift

- [ ] 1.1 Apply the ground, accent, and text-ramp values from `design.md — Decision 1` to the
  `@theme static` block in `src/styles/tokens.css`; verify `ng build` succeeds and the style guide
  at `/style-guide` renders every colour swatch with its new value.
- [ ] 1.2 Add `--color-scrim`, derived from `--color-void`, to the same block; verify it appears in
  the style guide's Colour section alongside the other tokens (the guide enumerates `:root`, so no
  guide edit is needed) and that it renders as a translucent wash, not opaque.
- [ ] 1.3 Replace the hardcoded `rgba(4, 4, 10, 0.95)` washes in `src/components/card/card.css`
  (name band, stat band) and `rgba(4, 4, 10, 0.85)` in `src/components/game/game.css` (overlay) with
  `var(--color-scrim)`; verify by grepping that no `rgba(4, 4, 10` literal remains in `src/`, and
  that card bands and the game overlay read as darkened-ground rather than black on the new palette.
- [ ] 1.4 Verify contrast: check `text-dim`, `text-muted`, and `text-bright` against the new
  `--color-void`, confirming each meets or beats the ratios tabulated in `design.md — Decision 1`
  and that `text-dim` now passes WCAG AA for normal text.
- [ ] 1.5 Walk `/battle`, `/shop`, `/cards`, `/game`, and `/style-guide` on the new palette and
  confirm the `CLAUDE.md` look-and-feel constraints still hold — nothing clipped, board tiles and
  all player and opponent cards visible, card aspect ratio unchanged.

## 2. Entrance pace tokens

- [ ] 2.1 Change `--dur-entrance` to `0.5s` and add `--dur-stagger: 0.09s` to the `:root` motion
  block in `src/styles/tokens.css`; verify both appear under the style guide's Motion section.
- [ ] 2.2 Rewrite `.fade-in` in `src/components/battle/battle.css` to derive its delay from
  `calc(var(--n, 0) * var(--dur-stagger))`, and reduce `fadeInUp`'s travel from `18px` to `12px`;
  verify no `--delay` reference remains in that stylesheet.
- [ ] 2.3 Replace the seven inline `--delay` literals in `src/components/battle/battle.html` with
  `--n` indices 0–6 in render order (top ornament, eyebrow, HOLLOW, MASTER, tagline, bottom
  ornament, nav); verify by grepping that no `--delay` remains in the template.
- [ ] 2.4 Verify the entrance settles in about a second: load `/battle` and confirm the Start Game
  button is at rest well inside 1.5s, that elements still arrive in sequence, and that clicking the
  button mid-entrance starts the game.

## 3. Title glow continuity

- [ ] 3.1 Hoist the resting soul glow into a `--glow-rest` custom property on `.title-hollow` and
  apply it as a static `text-shadow`; verify the title renders lit with animations disabled in
  devtools.
- [ ] 3.2 Rewrite `soulFlicker` so its `0%`/`100%` stops read `text-shadow: var(--glow-rest)`, and
  drop the `+ 1s` offset from the animation shorthand; verify by stepping the animation in devtools
  that the value at cycle start equals the static resting value.
- [ ] 3.3 Give `.title-master` the same treatment for gold — static resting `text-shadow`, and
  `goldShimmer`'s `0%`/`100%` stops carrying both `color: var(--color-gold-light)` and
  `text-shadow: var(--glow-rest)` so the gold halo no longer vanishes once per cycle.
- [ ] 3.4 Verify no pop: load `/battle` and watch through the entrance and at least one full flicker
  and shimmer cycle, confirming the title is lit from its first visible frame and that no step
  change in brightness occurs at the entrance handoff or at either loop seam.
- [ ] 3.5 Update the reduced-motion block so the static resting glow is what remains when animations
  are off; verify with `prefers-reduced-motion: reduce` emulated that the title is visible, lit, and
  still.

## 4. Particle field generator

- [ ] 4.1 Create `src/model/particle.ts` with the `Particle` interface, a `mulberry32` PRNG, and
  `createParticleField(count, seed)` implementing stratified `x`, `depth = rand() ** 1.6`, the
  four depth-derived properties, decorrelated sway, negative offsets, and the falling minority per
  `design.md — Decision 5`; verify it type-checks under `ng build`.
- [ ] 4.2 Add `particleVars(p)` to the same module, returning the CSS custom-property map the
  templates bind; verify every property the stylesheet reads has a corresponding entry with units.
- [ ] 4.3 Write `src/model/particle.spec.ts` covering: same seed yields identical fields; different
  seeds differ; every `x` and `y` falls inside the surface; sorted `x` leaves no gap wider than
  twice the mean spacing; sorting by depth leaves size and alpha non-decreasing and blur and rise
  non-increasing; every offset is negative and smaller in magnitude than its own rise; the falling
  fraction stays a minority. Verify `ng test` passes.

## 5. Particle primitive

- [ ] 5.1 Rewrite `.particle` in `src/styles/primitives.css` as the travelling box — position from
  `--x`, size from `--size`, `particleRise` driven by `--rise` and the negative `--offset` — and
  remove the `--i`, `--particle-gap`, and `--particle-stagger` contract along with the `nth-child`
  variation rules; verify no reference to `--i` or `--particle-gap` remains in the stylesheet.
- [ ] 5.2 Add the `.particle::after` dot carrying background, glow, `filter: blur(var(--blur))`,
  `opacity: var(--alpha)`, and the composed `particleSway` + `particleTwinkle` animations; verify in
  devtools that a single particle drifts laterally while rising and varies in brightness.
- [ ] 5.3 Add the `particleRise`, `particleFall`, `particleSway`, and `particleTwinkle` keyframes and
  the `.particle.falls` variant; verify a falling particle descends from above the surface and that
  only `transform` and `opacity` animate.
- [ ] 5.4 Update the reduced-motion block to rest particles at their generated `--x`/`--y` with
  animations off; verify with reduced motion emulated that the field stays scattered across both
  axes with its size and brightness variation intact, and that nothing sits outside the surface.

## 6. Wire the six surfaces

- [ ] 6.1 Convert `src/components/battle/` to the generator: replace the index array with
  `createParticleField(22, <seed>)`, bind `[style]="vars(p)"` and the `.falls` class in the
  template, and delete `--particle-gap` / `--particle-stagger` from its CSS; verify `/battle` shows
  a populated, drifting field on first paint.
- [ ] 6.2 Convert `src/components/game/` the same way at its existing count of 14; verify the
  in-game screen still satisfies the `CLAUDE.md` fit constraints.
- [ ] 6.3 Convert `src/components/shop/` (14) and `src/components/collection/` (14); verify both
  routes render a populated field immediately on navigation.
- [ ] 6.4 Convert `src/components/open-pack/` (18); verify its field renders and no
  `--particle-gap` declaration remains in its CSS.
- [ ] 6.5 Convert the style guide's atmosphere demo — replace the inline `[0..11]` array in
  `style-guide.html` with a generated field on the component and delete `--particle-gap` from
  `style-guide.css`; verify the demo tile shows the depth variation and that no `[style.--i]`
  binding remains anywhere in `src/`.

## 7. Verification

- [ ] 7.1 Run `ng build` and `ng test`; verify both succeed with no new warnings.
- [ ] 7.2 Run Prettier over the changed files and verify formatting is clean at the project's
  100-char / single-quote / angular-parser settings.
- [ ] 7.3 Review `/style-guide` end to end: confirm the token tables show the lifted palette and the
  new scrim and stagger tokens, that every primitive still reads correctly against the brighter
  ground, and that no card or board state has lost its glow.
- [ ] 7.4 Walk the full navigation loop — Battle → Shop → Cards → Battle → Start Game — and confirm
  the atmosphere is present the instant each page appears, the Battle entrance no longer stalls, and
  the title never flashes.
