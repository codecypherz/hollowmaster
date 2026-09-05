Sequenced per design.md — Migration Plan. The app must build and run after every group; nothing is deleted before its replacement is verified.

## 1. Token and primitive layer

- [x] 1.1 Create `src/styles/fonts.css` holding a single Google Fonts `@import` for Cinzel Decorative, Cinzel, and IM Fell English SC; verify by loading the app and confirming in devtools Network that the font stylesheet is requested exactly once
- [x] 1.2 Create `src/styles/tokens.css` with the `@theme` block defining semantic colors (`--color-void`, `--color-deep`, `--color-soul` and its dim/glow variants, `--color-gold` and its light/dim variants, `--color-crimson` and its dim/glow variants, the dim→muted→bright text ramp, `--color-cell-bg`, `--color-cell-border`), taking the `game.css` value wherever home and game currently disagree; verify each token resolves by inspecting `:root` in devtools
- [x] 1.3 Add type tokens (`--font-display`, `--font-ui`, `--font-flavor`), each with a declared serif fallback, plus spacing, motion-duration, and elevation tokens as ordinary custom properties alongside the theme block; verify the type tokens generate working `font-display` etc. utilities
- [x] 1.4 Create `src/styles/primitives.css` with `.void-bg`, `.mist-layer`, `.particles`/`.particle`, `.corner`, `.ornament`/`.orn-line`/`.orn-node`/`.orn-gem`, and `.hk-btn` plus its `.primary` variant — one definition each, taken from the current `game.css` versions and referencing tokens rather than literals; verify no literal hex value duplicating a token remains in the file
- [x] 1.5 Add a `prefers-reduced-motion: reduce` block to `primitives.css` suppressing mist drift, particle rise, and pulsing glows while leaving the elements visible; verify by enabling reduced motion in devtools rendering settings and confirming ambient animation stops with nothing disappearing
- [x] 1.6 Add a visible `:focus-visible` indicator to `.hk-btn` that does not depend on hover; verify by tabbing to a button and confirming the indicator appears
- [x] 1.7 Wire all three files into `src/styles.css` with `fonts.css` imported first (CSS requires `@import` before other rules), then Tailwind, then tokens and primitives; verify `ng build` succeeds and the app still renders

## 2. Home screen migration

- [x] 2.1 Capture reference screenshots of the home screen before any change, for comparison in 2.4
- [x] 2.2 Delete the local `@import`, the `.home-wrap` token block, and the duplicated `.void-bg`/`.mist-layer`/`.particle`/`.corner`/`.ornament`/`.hk-btn` rules from `home.css`, leaving only home-specific layout, the title treatment, and its entrance animations; verify the file no longer defines any token or primitive
- [x] 2.3 Rename all surviving `var(--soul)`-style references in `home.css` to their `var(--color-*)` equivalents; verify by grepping `home.css` for the old token names and confirming zero matches
- [x] 2.4 Compare the home screen against the 2.1 screenshots; verify the only differences are the slightly brighter reconciled soul blue and gold, with layout, spacing, animation timing, and particle behavior unchanged

## 3. Game screen token and primitive migration

- [x] 3.1 Capture reference screenshots of the game screen at several viewport sizes, for comparison in 3.4 and 5.4
- [x] 3.2 Delete the local `@import` and the duplicated primitive rules from `game.css`, keeping the `--card-h`/`--card-w`/`--arr` sizing chain on `.game-wrap` exactly as written; verify the sizing declarations are untouched and no primitive remains defined locally
- [x] 3.3 Rename all `var(--soul)`-style references in `game.css` to `var(--color-*)`; verify by grepping `game.css` for the old token names and confirming zero matches
- [x] 3.4 Compare the game screen against the 3.1 screenshots; verify board, hands, card sizing, and overlay are unchanged apart from the reconciled palette

## 4. Card component extraction

- [x] 4.1 Create `src/components/card/` as a standalone component with inputs `card`, `owner`, `faceDown`, `selected`, `selectable`, `flipped` and a `select` output; verify it compiles and can be imported by another standalone component
- [x] 4.2 Move the 3×3 `grid-template-areas` chevron ring and the three-section face (name, image, stats) into `card.html`/`card.css`, sized to 100% of the host with `aspect-ratio: 2.5 / 3.5` and reading `--arr` from the inherited cascade; verify a rendered card measures 2.5:3.5 at several host widths
- [x] 4.3 Implement rarity as stars in the top-left of the image section and attack/defense as icon-plus-progress-bar rows filled to the stat percentage; verify no rarity, attack, or defense numeral appears anywhere in the rendered output
- [x] 4.4 Implement the face-down state rendering the card back within the same aspect-ratio frame; verify name, artwork, rarity, stats, and chevrons are not discernible in that state
- [x] 4.5 Implement the owner, selected, unselectable, placeable, and captured states, each distinguishable by more than color alone; verify every state renders distinctly
- [x] 4.6 Give actionable cards keyboard reachability, a visible focus indicator, an accessible name, and pressed state, and keep display-only cards out of the tab order; verify by tabbing through a hand and activating a card with the keyboard
- [x] 4.7 Expose attack and defense values as accessible text that is not rendered visually; verify with an accessibility inspector that the values are announced
- [x] 4.8 Replace both duplicated card blocks in `game.html` with `<app-card>`, and replace the `.card.face-down` opponent markup with the component's face-down state; verify `game.html` contains no remaining copy of the card face structure
- [x] 4.9 Delete the now-unused `.card-face`, `.cf-*`, `.arr*`, and `.card.face-down` rules from `game.css`; verify the game screen still renders correctly and the rules have no remaining references
- [x] 4.10 Verify the CLAUDE.md in-game constraints at short, tall, narrow, and wide viewports: nothing clipped, both hands and all 16 board tiles visible, board tiles matching player and opponent card size, aspect ratio held throughout — the checkpoint that matters most in this change
- [x] 4.11 Play a full game start to finish; verify selection, placement, capture flip, scoring, and the game-over overlay all behave exactly as before the extraction

## 5. Open-pack retheme

- [x] 5.1 Replace the default-Tailwind markup in `open-pack.html` (`bg-white`, `text-gray-800`, `border-gray-300`, the blue button) with themed equivalents, rendering each drawn card through `<app-card>` inside a wrapper that sets its own `--card-w`; verify no default-palette utility class remains
- [x] 5.2 Style `open-pack.css` onto the token layer and use the `.hk-btn` primitive for the pack button; verify the component defines no button style of its own
- [x] 5.3 Verify the opened-pack cards render identically in structure and proportion to the game screen's cards, at the pack's own size

## 6. Routing shell and style guide

- [x] 6.1 Create `src/components/play/` and move the `gameService.isActive()` switch from `app.html` into it verbatim; verify the home-then-game flow behaves exactly as before
- [x] 6.2 Reduce `app.html` to `<router-outlet>` and register `''` → `Play` in `app.routes.ts`; verify the app root still loads the home screen and Start Game still enters the game
- [x] 6.3 Register `'style-guide'` → `StyleGuide` as a lazy `loadComponent` route; verify in devtools Network that the style guide chunk is not requested when loading the app root
- [x] 6.4 Create `src/components/style-guide/` rendering the color and type sections by enumerating the custom properties registered on `:root` at runtime and filtering by namespace prefix; verify that adding a token to `@theme` makes it appear on the page with no edit to the style guide
- [x] 6.5 Add the spacing, motion, and elevation token sections, each labelled with the token name producing it; verify displayed values match the live token set rather than transcribed copies
- [x] 6.6 Add the primitive section showing each button variant in resting, hover, focus, and disabled appearances side by side, plus the ornamental divider and corner framing; verify all four button states are simultaneously visible for comparison
- [x] 6.7 Add the card section showing player-owned, opponent-owned, selected, unselectable, placeable, face-down, and captured states plus an empty board tile, across the full rarity range; verify aspect ratio, three-section structure, chevron placement, stars, and numeral-free stat bars are all directly observable on the page
- [x] 6.8 Verify no player-facing screen links to the style guide and that visiting it starts, ends, or modifies no game state

## 7. Final verification

- [x] 7.1 Grep the whole `src/` tree for literal hex colors, font stacks, and duplicated `@import`s outside `src/styles/`; verify only genuinely local, non-themed values remain
- [x] 7.2 Run `ng build` and `ng test`; verify both succeed
- [x] 7.3 Walk home → game → game-over → open-pack → style-guide at two viewport sizes with reduced motion both on and off; verify every CLAUDE.md look-and-feel constraint holds throughout
