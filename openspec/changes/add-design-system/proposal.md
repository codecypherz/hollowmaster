## Why

The Hollow Knight visual language already exists in the app, but only as copy-pasted CSS. `home.css` and `game.css` each declare their own private token block, and the two have already drifted apart — `--soul` is `#b8ccff` in one and `#c4dcff` in the other, `--gold` is `#c8882a` vs `#e09030`, `--gold-dim` is `#6a4a14` vs `#8a5818`. Every new screen therefore starts by re-deriving the theme from scratch, and `open-pack` shows what happens when it doesn't: raw Tailwind defaults (`bg-white`, `text-gray-800`, `border-gray-300`) on a near-black game.

Codifying the system now, while the surface area is three components, makes the CLAUDE.md look-and-feel constraints enforceable in one place instead of re-checked by hand in every template.

## What Changes

**Token layer**
- Introduce a single Tailwind v4 `@theme` block in `src/styles.css` as the one source of truth for color, typography, spacing, motion, and elevation. Tailwind emits every token as a real CSS custom property *and* as utility classes, so existing `var(--…)` component CSS and Tailwind markup both draw from the same values.
- Reconcile the drifted values. The `game.css` pass is the newer, more refined one; its brighter, more saturated values win. The home screen's soul blue and gold shift slightly brighter as a result — this is the one intended visual change to an existing screen.
- Consolidate the duplicated Google Fonts `@import` (currently in both `home.css` and `game.css`) into a single load.

**Shared primitives**
- Extract the atmosphere and ornament layers duplicated between `home.css` and `game.css` — void background, mist layer, soul particles, corner frames, ornamental dividers, and the `.hk-btn` button — into a shared stylesheet with one definition each. Home and game keep only what is genuinely local to them (layout, sizing, screen-specific animation timing).

**Card component**
- Extract a standalone `<app-card>` component that owns the card face: the 2.5:3.5 frame, the three sections (name / image / stats), the eight directional chevrons, the rarity stars, and the stat bars. `game.html` currently repeats this ~30-line block twice (hand card and board cell); both collapse to a single element, and the face-down opponent card becomes a state of the same component rather than separate markup.
- Every CLAUDE.md card constraint becomes enforceable in exactly one file.

**Component adoption**
- Refactor `home` and `game` onto the token layer and primitives, with no intended visual change beyond the reconciled palette noted above.
- Retheme `open-pack` onto the design system, replacing its default-Tailwind light-mode styling and rendering its cards through `<app-card>`.

**Living style guide**
- Add a `/style-guide` route rendering every token, primitive, and card state on one page — color ramps, type scale, buttons, ornaments, card states (player / opponent / selected / placeable / face-down), and board tiles — so future UI work has a visual reference and drift is immediately visible.
- Introduce a `<router-outlet>` app shell. `app.html` currently switches between home and game with an `@if` on `GameService.isActive()`; that switch moves into a route component so a second route can exist alongside it. The existing start-game flow is unchanged from the player's perspective.

Nothing here changes game rules, scoring, or the card database.

## Capabilities

### New Capabilities
- `design-system/tokens`: The canonical design token set — color, typography, spacing, motion, elevation — its delivery as both CSS custom properties and Tailwind utilities, and the rule that no component may hardcode a themed value.
- `design-system/primitives`: The shared visual primitives (void background, mist, soul particles, corner frames, ornamental dividers, buttons) defined once and reused across screens.
- `design-system/card`: The card rendering contract — aspect ratio, the three sections, chevron placement, rarity stars, stat bars without numerals, owner and interaction states, and size parity between player, opponent, and board-tile cards.
- `design-system/style-guide`: The living style guide surface that renders every token, primitive, and card state for visual reference and regression checking.

### Modified Capabilities

None — `openspec/specs/` currently contains no specs, so every capability above is new.

## Impact

**New files**
- `src/styles/tokens.css`, `src/styles/primitives.css`, `src/styles/fonts.css`
- `src/components/card/` (`card.ts`, `card.html`, `card.css`)
- `src/components/style-guide/` (`style-guide.ts`, `style-guide.html`, `style-guide.css`)
- `src/components/play/` — the route component holding the home/game switch lifted out of `app.html`

**Modified files**
- `src/styles.css` — gains the `@theme` block and the shared imports
- `src/components/home/home.css`, `home.html` — token block, fonts, and primitives removed
- `src/components/game/game.css`, `game.html` — same, plus card markup replaced by `<app-card>`
- `src/components/open-pack/open-pack.html`, `open-pack.css` — rethemed
- `src/app/app.html`, `src/app/app.routes.ts` — router shell

**Risk**
- The game screen's layout is tightly tuned (`--card-h` is a `clamp()` derived from `100dvh` so five cards fit vertically). The card extraction must preserve that sizing chain exactly, or the CLAUDE.md no-clipping constraints break. Verification is visual, at multiple viewport sizes.
- No dependency changes. Tailwind v4 is already installed and currently has no theme configuration at all.
