## Context

See proposal.md — Why.

Three facts about the current code shape the approach:

- `src/app/app.html` is two lines — `<app-nav-shell />` then `<router-outlet />` — inside a `:host` that is `display: flex; flex-direction: column; min-height: 100dvh`. The nav takes its natural height; every routed page's `:host` sets `flex: 1` and hands that height to its own `.page-wrap` / `.home-wrap`, which is what lets the atmosphere and corner frames reach the viewport edges.
- `NavShell` decides its own visibility with `@if (visible())`, keyed off the URL not on `GameService.isActive()` (a battle can be in progress while the player browses the Shop). It renders *nothing* on `/game`, so no space is reserved — the in-game screen's `height: 100dvh` and its `--card-h: clamp(65px, calc((100dvh - 7rem) / 5 - 6px), 220px)` chain are computed against the whole viewport.
- `.hk-btn` in `src/styles/primitives.css` already reads its metrics through two custom properties with inline fallbacks: `font-size: var(--btn-font-size, 0.7rem)` and `padding: var(--btn-padding, 0.8rem 2.2rem)`. Two surfaces currently set those properties on an ancestor: `.nav-shell` (0.62rem / 0.55rem 1.6rem) and `.game-wrap` (0.65rem / 0.65rem 1.8rem).

That third fact is the hinge: the primitive is already parameterised for size, it just has no *named* steps.

## Goals / Non-Goals

**Goals:**

- Move the nav without changing what any page's `:host` contract is — pages should keep working with no CSS change of their own.
- Express "large" as a design-system step other screens can reuse, on the mechanism the primitive already has, so the CSS delta in `primitives.css` is a handful of lines.
- Leave the in-game screen's rendering bit-identical.

**Non-Goals:**

- Reworking `.game-wrap`'s bespoke 0.65rem button metrics into a named step. They are a tuned value for the 100dvh card-stacking chain, not a general step, and the in-game layout constraints make touching that screen a needless risk here.
- Responsive or mobile-specific nav behaviour (icon rail, collapsing, safe-area insets). `.nav-links` already wraps; that is as far as this change goes.
- Any change to the route map, the guard, or `GameService`.

## Decisions

### The nav becomes the last row of the shell column, not a fixed overlay

`app.html` becomes `<router-outlet />` then `<app-nav-shell />`. Everything else about the shell stays: it is already a flex column at `min-height: 100dvh`, and every page already claims `flex: 1`, so the page absorbs the height above and the nav settles at the bottom on its own. Zero CSS change in `app.css` and zero in the three page components.

*Alternative — `position: fixed; bottom: 0`:* survives page scrolling, but floats over content, so every page would need bottom padding equal to a nav height it does not know, and the pages' full-bleed atmosphere and corner frames would run underneath it. Rejected: it trades a guaranteed no-overlap property for scroll behaviour no current page needs — all three out-of-battle pages fit the viewport.

*Chosen alongside it — `position: sticky; bottom: 0` on the shell's `:host`:* in-flow placement alone was not enough. It was measured wrong at planning time: the nav also renders on `/style-guide`, which is ~5,950px tall, and any viewport shorter than a page's intrinsic height (the Battle splash needs ~608px) pushes the bar below the fold. Sticky fixes both while keeping the property that made in-flow attractive — the slot stays reserved, so at full scroll the bar sits in its own space and covers nothing. It does not need the shell to be the scroll container; the document is the containing scroller, and `bottom: 0` pins the bar to the viewport edge until its in-flow position catches up.

*Alternative — the shell owns the scroll (`height: 100dvh; overflow: hidden` on the shell, pages scrolling internally):* would make the bar a true fixed last row, but changes scroll behaviour on every page including the style guide. Rejected as a much larger blast radius for the same result.

### The dividing hairline flips from `border-bottom` to `border-top`

`.nav-shell` currently carries `border-bottom: 1px solid var(--color-gold-dim)` — the edge between the bar and the page below. At the bottom of the screen the same edge belongs above the bar, so it becomes `border-top` with the same token. The two flanking `.nav-rule` gradient hairlines are unaffected; they are horizontal and orientation-agnostic.

`:host` keeps `z-index: 20` and its `--color-void` background. Neither matters for stacking any more, but both are cheap insurance against a page's atmosphere layer bleeding into the bar.

### The large size is a class on the primitive, not a new token

Add to `primitives.css`:

```css
.hk-btn.lg {
  --btn-font-size: 0.85rem;
  --btn-padding: 1.1rem 3rem;
}
```

This rides the mechanism `.hk-btn` already uses, so the step composes with `.primary` for free — `.hk-btn.primary.lg` needs no extra rule — and it satisfies the spec's "selectable by name" without a second styling system.

*Alternative — `--btn-font-size-lg` / `--btn-padding-lg` tokens on `:root`:* rejected on two counts. Button metrics are not tokens today (they live as inline `var()` fallbacks in the primitive), so this would introduce a new token family for one consumer; and the style guide's token enumeration groups by the prefixes `--color-`, `--font-`, `--spacing-`, `--dur-`, `--ease-`, `--elev-`, so a `--btn-*` token would be read at runtime and then silently dropped from every group — breaking the "complete token coverage" requirement unless `GROUPS` grew a seventh entry too. Not worth it for two values.

*Sizing rationale:* 0.85rem against the 0.7rem default is a clear step up while staying inside the Cinzel small-caps look at 0.22em tracking; 1.1rem 3rem padding keeps roughly the primitive's 1 : 2.7 padding ratio, landing each nav button near a 44px touch target.

### The nav drops its local metrics and selects the step

`.nav-shell` loses `--btn-font-size` and `--btn-padding`; the three links become `class="hk-btn lg"`. Bar padding (currently `0.9rem var(--spacing-frame)`) is retuned down — the buttons now supply most of the bar's height, and the constraint that matters is that the taller bar must not squeeze the pages above it.

### Destination order is markup order

The three `<li>`s are reordered to Shop, Battle, Cards. `.nav-links` is a centred flex row, so visual order follows DOM order and the tab order stays consistent with it — no `order` property, which would desynchronise the two.

### The style guide gains a large row

The Buttons section renders a third `@for` row over `buttonStates` with `class="hk-btn lg"`, matching the existing standard and primary rows. The guide's "each variant is shown in resting, hover, focus, and disabled" requirement is unchanged; the new row is what keeps satisfying it.

## Risks / Trade-offs

- **A taller bar takes height from the pages above it** → The pages are centred flex boxes that shrink gracefully; the in-game screen — the one surface with a hard height budget — has no nav at all, so its `--card-h` chain is untouched. Verify the three out-of-battle pages at a short viewport after the change.
- **~~The nav scrolls out of view if a page ever exceeds the viewport~~** → Found in verification, not deferred: `/style-guide` and any short viewport hit it immediately. Resolved by the sticky decision above. Residual: while a long page is scrolled mid-document, content passes *under* the pinned bar; scrolling to the end always reveals it, since the slot is reserved.
- **~~Larger buttons wrap to two rows on a narrow viewport~~** → Measured worse than predicted: at 380px the three destinations stacked into *three* rows, 238px of nav, pushing the page past the fold. Resolved as the risk itself suggested — `.hk-btn.lg` gives back horizontal padding below 480px (keeping its type size, which is the point of the step), and the nav hides its two decorative `.nav-rule` hairlines at the same width so the destinations get their flex space. One row at 380px, no metrics reintroduced in the nav.
- **Muscle memory: Battle moves from the leftmost slot to the centre** → Accepted, and the point of the change. Active-destination marking is unchanged, so the current page is still unambiguous.
- **`.hk-btn.lg` on `.nav-links a` needs the anchor to keep `display: inline-block`** → It already does, and padding applies to it; no change needed, but it is the thing to check first if the buttons come out flat.
