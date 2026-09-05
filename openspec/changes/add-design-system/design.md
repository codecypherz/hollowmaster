## Context

See proposal.md — Why. The constraints that shape the approach:

- **Tailwind v4 is installed but unconfigured.** `src/styles.css` is two lines: a comment and `@import "tailwindcss"`. There is no `@theme` block, so Tailwind currently knows nothing about the palette. Its utilities have only been used once — in `open-pack`, where they produced the light-mode styling the theme has to undo.
- **Component styles are Angular-scoped.** Each component's `styleUrl` is view-encapsulated, so a class defined in one component's CSS is invisible to another. This is precisely why the primitives were copy-pasted rather than shared: there was no mechanism to share them. Anything meant to be reusable must therefore live in a globally-loaded stylesheet, not in a component's own.
- **The game layout is a tuned sizing chain, and it is load-bearing.** `game.css` derives everything from two custom properties:
  ```
  --card-h: clamp(65px, calc((100dvh - 7rem) / 5 - 6px), 220px);
  --card-w: calc(var(--card-h) / 1.4);
  --arr:    clamp(13px, calc(var(--card-w) * 0.126), 22px);
  ```
  The board grid, both hands, the 3×3 chevron grid, and every font size inside the card face are all functions of these. The CLAUDE.md no-clipping and size-parity constraints are satisfied *by this chain*, not by any explicit check. Any refactor that severs it breaks them silently.
- **The card face is already duplicated twice inside `game.html`.** The hand-card block and the board-cell block are the same ~30 lines of markup — eight chevron divs wrapped around a three-section face — differing only in their wrapper element and the expression that supplies the card.
- **`openspec/specs/` is empty.** There is no prior spec organization to conform to; this change establishes the layout.

## Goals / Non-Goals

**Goals**

- Make an incorrect value *impossible to reach* rather than merely discouraged: one definition per token, consumed both ways.
- Preserve the game screen's sizing chain byte-for-byte in behavior while moving where it lives.
- Leave home and game visually unchanged apart from the reconciled palette.
- Make the CLAUDE.md card constraints checkable in one file and observable on one page.

**Non-Goals**

- No redesign. This change relocates and reconciles the existing visual language; it does not reinterpret it. New ornament, new layouts, and new animation are out of scope.
- No responsive or mobile work. The existing `clamp()`-based scaling is preserved as-is; small-viewport layout remains a separate concern.
- No light theme, and no theme switching. The game is a single dark identity.
- No component library beyond what the three existing screens plus the style guide actually need. Primitives are extracted because they are already duplicated, not speculatively.
- No changes to game rules, scoring, `GameService`, or `CARD_DB`.

## Decisions

### 1. Tokens live in a Tailwind `@theme` block, not a `:root` block

`@theme` in Tailwind v4 emits each entry as a real CSS custom property on `:root` *and* registers it with the utility generator. One declaration yields `var(--color-soul)` for the component CSS that already uses that idiom, and `text-soul` / `border-soul` for markup. The two forms cannot drift because they are generated from the same entry — which is the actual requirement in `design-system/tokens`.

The naming is constrained: Tailwind derives utility names from the token's namespace prefix, so colors must be `--color-*` and families `--font-*`. Component CSS therefore migrates from `var(--soul)` to `var(--color-soul)`. A mechanical rename, but it touches every rule in both stylesheets, so it is worth doing in one pass rather than incrementally.

*Alternatives considered.* A plain `:root` block in a `tokens.css` is simpler and framework-agnostic, but leaves Tailwind's utilities blind to the palette — meaning `open-pack`, the one component written in utility classes, could not be rethemed with utilities and would need a hand-written class for every themed property. Rejected: it preserves the exact gap that let `open-pack` drift. A Sass or JS token pipeline was not considered seriously; the project has no build step for it and CSS custom properties already do the job at runtime.

### 2. Shared CSS is loaded globally and imported into `styles.css`

Three files under `src/styles/`:

| File | Contents |
| --- | --- |
| `fonts.css` | The single Google Fonts `@import`, currently duplicated in `home.css` and `game.css` |
| `tokens.css` | The `@theme` block — the whole palette, type, spacing, motion, elevation set |
| `primitives.css` | `.void-bg`, `.mist-layer`, `.particles`/`.particle`, `.corner`, `.ornament`/`.orn-*`, `.hk-btn` and variants |

`styles.css` imports all three plus Tailwind. Because Angular's view encapsulation would otherwise scope these away, being global is a requirement rather than a convenience — but it also means primitive class names are effectively a global namespace, so they keep the existing `hk-`/`orn-` prefixes and stay narrow.

Font `@import` ordering matters: CSS requires `@import` before other rules, so `fonts.css` must be imported first.

### 3. `<app-card>` owns the whole card, including its chevrons

The natural instinct is to scope the component to the face and leave the eight chevrons to the caller, since the chevrons live *outside* the three sections. That is the wrong cut: the chevron ring and the face are one 3×3 grid — `grid-template-areas` with `face` at the center — and splitting them across a component boundary would put the grid in the caller and half its children in the component. It also breaks CLAUDE.md's "chevrons within the border but outside the sections" constraint out into every call site, which is exactly the duplication being removed.

So `<app-card>` is the entire card: the 3×3 grid, the chevron ring, the three sections, the stars, and the stat bars. The public surface:

- `card` — the card to render; absent means an empty slot
- `owner` — `'player' | 'opponent' | null`, driving the owner treatment
- `faceDown` — renders the card back instead of the face
- `selected`, `selectable`, `flipped` — interaction and capture states
- `select` — output, emitted on activation when selectable

The face-down back becomes a state of this component rather than the separate `.card.face-down` markup it is today, which is how it inherits the aspect-ratio guarantee that `design-system/card` requires of it.

*Alternatives considered.* Shared CSS classes with duplicated markup would have been a smaller diff, but leaves three copies of the structure to keep in sync and no single place to enforce the card constraints. Rejected on the same grounds as the token decision — it preserves the drift mechanism.

### 4. The card component receives its size; it does not choose one

`--card-h` and `--card-w` stay defined on `.game-wrap`, where they can see the game screen's own layout budget. `<app-card>` sizes itself to 100% of its host and reads `--arr` from the inherited cascade. Custom properties inherit through Angular's view encapsulation — encapsulation rewrites selectors, it does not create a cascade boundary — so this works without `::ng-deep` or any escape hatch.

This keeps the tuned chain intact and, more importantly, keeps its *ownership* correct: only the game screen knows that five cards must stack vertically within `100dvh`. The style guide and `open-pack` set their own `--card-w` on a wrapper, and the same component renders correctly at their sizes.

The aspect ratio is the one thing the component does enforce itself, via `aspect-ratio: 2.5 / 3.5` rather than the current implicit `--card-h / 1.4`. `1.4` *is* `3.5 / 2.5`, so this is the same number stated in a form that fails loudly instead of silently if a caller sets a conflicting height.

### 5. Routing: a `play` route component absorbs the current `@if`

`app.html` today switches on `gameService.isActive()`. `provideRouter` is already configured with an empty route table, so the shell exists but is unused.

That `@if` moves verbatim into a new `Play` component, and `app.html` becomes a `<router-outlet>`:

```
''            → Play        (the existing home ⇄ game switch, unchanged)
'style-guide' → StyleGuide  (lazy-loaded)
```

`StyleGuide` is lazy-loaded via `loadComponent`, so its markup and styles are not in the initial bundle — which is what `design-system/style-guide`'s "adds no weight to the game screens" requirement asks for. No link to it is rendered anywhere in the app; it is reached by URL.

*Alternatives considered.* Gating the style guide behind a dev-only flag would keep it out of production entirely, but adds build configuration for a page whose cost, once lazy-loaded, is a route entry. Not worth it at this size.

### 6. The style guide reads tokens from the live stylesheet

A style guide that hardcodes its own swatch list is a fourth copy of the palette, and would drift like everything else here has. Instead it enumerates the custom properties actually registered on `:root` at runtime (`getComputedStyle`, filtered by namespace prefix) and renders a swatch per entry. A token added to `@theme` appears on the page with no further edit — the "a new token appears automatically" and "values shown match values used" scenarios both fall out of this rather than being maintained by hand.

Card and primitive sections stay hand-authored: they are compositions, not enumerable data, and there is no honest way to derive "every state a card can be in" from the stylesheet.

## Risks / Trade-offs

**The sizing chain breaks and cards clip.** The highest risk in the change, and it fails visually rather than loudly — nothing throws, the cards just overflow. → The chain is preserved rather than rewritten: the same `clamp()` expressions stay on `.game-wrap`, and the component consumes them. Verification is explicit: after the card extraction, the game screen is checked at short, tall, narrow, and wide viewports for the CLAUDE.md constraints (nothing clipped, both hands and all board tiles visible, tiles matching card size). This is called out as its own task rather than folded into the refactor.

**The `var(--soul)` → `var(--color-soul)` rename is broad and mechanical.** Hundreds of references across two large stylesheets; a missed one silently resolves to nothing and renders as an unset color. → Rename per-file with the screen open, and grep for surviving references to the old names when done. A leftover is visible as an obviously wrong color, not a subtle one.

**The home screen's appearance changes.** The reconciled palette makes its soul blue and gold slightly brighter. This is intended and stated in the proposal, but it is a real visual change to a screen the user may consider finished. → Confined to the reconciled tokens; if the home values turn out to be preferred on sight, the fix is one edit in one place, which is the point of the change.

**Global primitive classes are a shared namespace.** Angular's encapsulation no longer protects against a component's local class colliding with `.corner` or `.ornament`. → Keep the prefixed names, keep the primitive set to what is already duplicated, and let the style guide serve as the visible inventory of what is taken.

**Tailwind `@theme` naming is opinionated.** Utility generation depends on the `--color-*` / `--font-*` namespaces, so semantic names must fit Tailwind's scheme. → The palette is already semantic (`soul`, `gold`, `crimson`, `void`); it maps onto `--color-*` without contortion. Non-color tokens that Tailwind has no namespace for are declared as ordinary custom properties alongside the theme block and consumed via `var()` only.

## Migration Plan

Sequenced so the app runs after every step and each step is independently revertible:

1. **Add the token and primitive layer** without removing anything. Both old and new definitions coexist; the app is unchanged.
2. **Migrate `home`**, deleting its local tokens, fonts, and primitives. Verify against the previous appearance — the reconciled palette is the only expected difference.
3. **Migrate `game`'s tokens and primitives**, leaving its card markup alone. Same verification.
4. **Extract `<app-card>`** and replace the two duplicated blocks in `game.html`. Verify the sizing chain and the CLAUDE.md constraints at multiple viewports — the checkpoint that matters most.
5. **Retheme `open-pack`** onto tokens and `<app-card>`.
6. **Add the router shell and the style guide.** Confirm the home-then-game flow is untouched.

Rollback is per-step; nothing is deleted before its replacement is in place and verified.

## Open Questions

- The reconciled palette adopts the game screen's brighter values, which shifts the home screen. Whether that reads better on the home screen is a judgment call best made looking at it in step 2 — it does not change the specs, the approach, or the task breakdown either way, since the values live in one place regardless of which set wins.
