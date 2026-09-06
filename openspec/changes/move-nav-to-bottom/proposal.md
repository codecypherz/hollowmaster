## Why

The navigation shell currently sits at the top of the viewport as a thin bar of small (0.62rem) links, which reads as web-page chrome rather than as part of a game. Anchoring it to the bottom of the screen and giving it substantial, thumb-sized controls makes it read as a game's action bar, and ordering it Shop · Battle · Cards puts the primary destination — Battle — in the centre where the eye lands first.

## What Changes

- The navigation shell **moves from the top of the app shell to the bottom**. It becomes the last row of the shell column: the routed page takes the remaining height above it, and the nav sits beneath, in flow rather than floating over page content.
- Its ornamental edge follows it — the hairline that currently separates the bar from the page below becomes the line that separates it from the page above.
- The destination order changes from **Battle · Shop · Cards** to **Shop · Battle · Cards**, so Battle occupies the centre slot and Shop the left. The set of destinations is unchanged, as is active-destination marking.
- The shared button primitive gains a **large size variant**. Size becomes an axis independent of the existing standard/primary treatment: any button can be large, and a large button keeps its variant's colours, border, hover, focus, and disabled behaviour unchanged.
- The navigation shell adopts that large variant and **drops its local `--btn-font-size` / `--btn-padding` overrides**, so nav buttons are sized by the design system rather than by nav-local values.
- The style guide renders the new size alongside the existing variants, as its primitive-coverage requirement already demands.
- The rule that the shell yields the whole viewport during a battle is **unchanged** — the in-game screen still renders with no nav at all, so the board and both players' cards keep the full 100dvh.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `navigation/shell`: Two requirement changes. The shell's placement becomes part of its specified behaviour — it is anchored at the bottom of the viewport and does not overlay page content — and the order of the destinations it offers is specified as Shop, Battle, Cards.
- `design-system/primitives`: The button primitive requirement currently describes exactly two treatments (standard and primary) on a single implied size. It is restated so size is a second, independent axis with a standard and a large step, and so that a large button is guaranteed to differ from a standard one only in scale.

## Impact

- **App shell**: `src/app/app.html` — `<app-nav-shell />` moves after `<router-outlet />`. `src/app/app.css` — the column already stretches to `100dvh` with `flex-direction: column`; the routed page keeps `flex: 1` so it absorbs the remaining height.
- **Navigation**: `src/components/nav-shell/nav-shell.html` — link order reordered to Shop, Battle, Cards; links take the large size class. `src/components/nav-shell/nav-shell.css` — `border-bottom` becomes `border-top`, local button-metric overrides removed, bar padding retuned for the taller controls.
- **Design system**: `src/styles/primitives.css` — a large size step added to `.hk-btn`, expressed through the existing `--btn-font-size` / `--btn-padding` custom properties the primitive already reads. `src/styles/tokens.css` — new sizing tokens only if the values warrant naming; no colour, type, or motion token changes.
- **Style guide**: `src/components/style-guide/style-guide.html` — a large-button row added to the Buttons section so every variant/size combination stays visible.
- **Pages**: `battle`, `shop`, and `collection` already use `flex: 1` under the shell and need no change; their comments referring to "the column below the nav shell" become stale and are corrected.
- **Not affected**: the route map and guard, `GameService`, the card model and `CARD_DB`, the card component, the game rules engine, and the in-game screen's layout — the nav is still absent there.
