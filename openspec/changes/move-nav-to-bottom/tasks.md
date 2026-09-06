## 1. Design system — the large size step

- [x] 1.1 Add a `.hk-btn.lg` rule to `src/styles/primitives.css`, next to the `.primary` variant, setting `--btn-font-size: 0.85rem` and `--btn-padding: 1.1rem 3rem`; verify in the browser that a `.hk-btn.lg` renders larger than a plain `.hk-btn` while its border, colours, and hover glow are unchanged.
- [x] 1.2 Confirm the step composes with the treatment axis: render `.hk-btn.primary.lg` and verify it is soul-accented at the large dimensions, with no additional rule needed for the combination.
- [x] 1.3 Add a large-button row to the Buttons section of `src/components/style-guide/style-guide.html`, mirroring the existing `@for (state of buttonStates)` rows with `class="hk-btn lg"` and a `large · {{ state }}` label; verify at `/style-guide` that resting, hover, focus, and disabled are all visible for the large size.

## 2. Navigation shell — placement

- [x] 2.1 In `src/app/app.html`, move `<app-nav-shell />` below `<router-outlet />`; verify the nav renders at the bottom of the viewport on `/battle`, `/shop`, and `/cards`.
- [x] 2.2 In `src/components/nav-shell/nav-shell.css`, change `.nav-shell`'s `border-bottom` to `border-top` (same `var(--color-gold-dim)`); verify the hairline now falls between the bar and the page above it.
- [x] 2.3 Verify no page content is overlapped: on each of the three pages, check that the page's atmosphere, corner frames, and centred content stop at the nav's top edge rather than running beneath it, and that `app.css` and the three page stylesheets needed no change to make that true.
- [x] 2.4 Correct the now-stale comments that describe the page column as sitting "below the nav shell" in `src/components/battle/battle.css`, `src/components/shop/shop.css`, and `src/components/collection/collection.css`, and the `:host` comment in `src/app/app.css`; verify each comment matches the new top-to-bottom order.

## 3. Navigation shell — order and sizing

- [x] 3.1 Reorder the `<li>` elements in `src/components/nav-shell/nav-shell.html` to Shop, Battle, Cards; verify the rendered order left-to-right and that tabbing through the bar visits them in the same order.
- [x] 3.2 Add `lg` to each destination link's class in `nav-shell.html` and delete the `--btn-font-size` / `--btn-padding` declarations from `.nav-shell` in `nav-shell.css`; verify the three links render at the large size and that `nav-shell.css` no longer declares any button metrics.
- [x] 3.3 Retune `.nav-shell`'s own `padding` (currently `0.9rem var(--spacing-frame)`) for the taller controls; verify the bar's vertical rhythm reads as deliberate rather than cramped or padded twice, and that the flanking `.nav-rule` hairlines still align with the buttons' vertical centre.
- [x] 3.4 Verify active-destination marking still works after the reorder: load `/shop`, `/battle`, and `/cards` directly by URL and confirm exactly the matching link carries the soul-accented `is-active` treatment.

## 4. Fixes found in verification

- [x] 4.1 Pin the bar to the viewport's bottom edge with `position: sticky; bottom: 0` on `nav-shell`'s `:host`, so a page taller than the viewport — `/style-guide`, or any page on a short viewport — does not carry it out of reach; verify the bar's bottom edge equals the viewport height both at load and scrolled to the end, on `/battle`, `/shop`, `/cards`, and `/style-guide`.
- [x] 4.2 Keep the three destinations on one row at phone widths: tighten `.hk-btn.lg`'s horizontal padding below 480px in `primitives.css` (type size unchanged) and hide the decorative `.nav-rule` hairlines at the same width in `nav-shell.css`; verify at 380px wide that the destinations occupy a single row and the document does not overflow.

## 5. Layout and theme verification

- [x] 5.1 Verify the in-game screen is untouched: start a battle, confirm no navigation renders on `/game`, and confirm the board, all board tiles, and both players' cards are fully visible and unclipped at a normal and a short viewport — the project's in-game layout constraints.
- [x] 5.2 Verify the three out-of-battle pages at a short viewport (roughly 600px tall) and at a narrow one (roughly 380px wide): the navigation control is fully visible and unclipped at both, and the destinations hold one row at 380px. Note: the Battle splash's own content needs ~608px and so still overflows a 600px-tall viewport — a pre-existing condition (679px document before this change, 693px after, the difference being the taller bar), not introduced here and out of this change's scope.
- [x] 5.3 Verify the theme constraints hold: the enlarged buttons and repositioned bar still read as Hollow Knight chrome, and `nav-shell.css` introduces no literal colour, font, or shadow that duplicates a token.
- [x] 5.4 Run `ng build` and `ng test`, and run Prettier over the touched `.html` and `.css` files; verify the build succeeds, the suite passes, and formatting is clean.
