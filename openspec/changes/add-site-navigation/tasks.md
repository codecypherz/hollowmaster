## 1. Rework the Battle page and retire the toggle

- [ ] 1.1 Move `src/components/home/` to `src/components/battle/`, renaming the files to `battle.ts` / `battle.html` / `battle.css`, the class `Home` to `Battle`, and the selector `app-home` to `app-battle`; leave the template and CSS content unchanged. Verify `ng build` succeeds and the splash renders identically.
- [ ] 1.2 Move the `startGame` handling into `Battle` itself: inject `GameService` and `Router`, and have the `startGame` output's handler call `gameService.startGame()` then `router.navigate(['/game'])`. Verify clicking "Start Game" lands on `/game` with the board rendered.
- [ ] 1.3 Delete `src/components/play/` entirely. Verify nothing imports `Play` (`grep -r "components/play" src`) and `ng build` succeeds.
- [ ] 1.4 Change `Game`'s `exitGame()` to clear state first and then navigate to `/battle`. Verify leaving a battle returns to the Battle page with no game active.

## 2. Route map and guard

- [ ] 2.1 Add `src/app/game-active.guard.ts` exporting a functional `CanActivateFn` that returns `true` when `GameService.isActive()` and otherwise a `UrlTree` for `/battle`, starting no game. Verify a unit test covers both branches.
- [ ] 2.2 Rewrite `src/app/app.routes.ts` to the map in design.md: `''` → redirect to `battle` with `pathMatch: 'full'`, `battle` → `Battle` (eager), `shop` → lazy `Shop`, `cards` → lazy `Collection`, `game` → `Game` guarded by `gameActiveGuard`, `style-guide` unchanged, `**` → redirect to `battle`. Verify each route loads by URL and an unknown path redirects to `/battle`.
- [ ] 2.3 Verify the guard's redirect behaviors by hand: navigating to `/game` with no game in progress redirects to `/battle`, and reloading the browser while on `/game` also redirects to `/battle`.

## 3. Shop and Cards skeletons

- [ ] 3.1 Create `src/components/shop/` (`Shop`, selector `app-shop`) as a standalone component: atmosphere layers, corner frame, and ornament reused from `primitives.css` the way `battle.html` does, plus a title, one line stating the page is for buying packs of cards, and a "coming soon" marker. No prices, no purchasable packs, no currency balance. Verify `/shop` renders themed and unclipped.
- [ ] 3.2 Create `src/components/collection/` (`Collection`, selector `app-collection`) with the same structure, its copy naming both purposes — viewing the collection and building decks — and the same "coming soon" marker. No fabricated owned cards or saved decks. Verify `/cards` renders themed and unclipped.
- [ ] 3.3 Verify both pages use only existing tokens from `src/styles/tokens.css` — `grep` their CSS for hard-coded hex colours and font stacks and replace any with the matching `var(--…)`.

## 4. Navigation shell

- [ ] 4.1 Create `src/components/nav-shell/` (`NavShell`, selector `app-nav-shell`) importing `RouterLink` and `RouterLinkActive`, with links to `/battle`, `/shop`, and `/cards` and no link to `/style-guide`. Verify the active link is marked on each of the three routes, including when the route is loaded directly by URL.
- [ ] 4.2 Give `NavShell` route-driven visibility: derive the current URL from the `Router` (a signal from `router.events`, or `toSignal` over the `NavigationEnd` stream) and wrap the whole nav in `@if` so it renders nothing on the `/game` route. Use `@if`, not `display: none`. Verify no nav element is in the DOM on `/game`.
- [ ] 4.3 Style `NavShell` from the existing tokens and primitives — reuse `.hk-btn` where it fits rather than defining a parallel button. Verify `grep` finds no new hex colours or font stacks in `nav-shell.css`.
- [ ] 4.4 Update `src/app/app.html` to `<app-nav-shell />` above `<router-outlet />` and import `NavShell` in `App`. Verify the nav appears on Battle, Shop, and Cards and is absent on the in-game screen.

## 5. Verification against the layout constraints

- [ ] 5.1 Start a battle and verify the in-game screen is unchanged from before this change: the board, every board tile, the player's cards, and the opponent's cards are all fully visible with no clipping, and the screen uses the full viewport.
- [ ] 5.2 Verify page state boundaries: with a battle in progress, navigate to `/shop` and `/cards` and back to `/game` — the battle is still in progress and unaltered; with no battle, move among the three pages and confirm no game is started.
- [ ] 5.3 Verify the style guide stays a development reference: `/style-guide` still renders, and it is offered nowhere in the nav shell or on any player-facing screen.
- [ ] 5.4 Run `ng test` and `ng build` and confirm both pass.
- [ ] 5.5 Run `npx prettier --check "src/**/*.{ts,html,css}"` and fix any formatting the change introduced.
