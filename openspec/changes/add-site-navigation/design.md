## Context

See `proposal.md` — Why.

The relevant current state:

- `app.routes.ts` has two routes: `''` → `Play`, and a lazy `style-guide`. `app.html` is nothing but `<router-outlet />`.
- `Play` is a thin dispatcher: `@if (!gameService.isActive()) { <app-home/> } @else { <app-game/> }`. It exists purely so the shell could host a router outlet — the comment in the file says as much.
- `GameService` holds the whole game in one `signal<GameState | null>`. `isActive()` is `state() !== null`. There is no persistence: a reload loses the game.
- `Home` emits a `startGame` output; `Play` calls `gameService.startGame()`. `Game` calls `gs.exitGame()` directly.
- Theme values live in `src/styles/tokens.css` (a Tailwind v4 `@theme static` block) and shared rules in `src/styles/primitives.css`, which is where cross-component rules must go because Angular's view encapsulation scopes component CSS. There is a `.hk-btn` primitive already.
- `CLAUDE.md` imposes hard in-game layout constraints: nothing clipped, maximum use of space, player and opponent cards and every board tile always visible.

## Goals / Non-Goals

**Goals:**

- One place that answers "what routes exist and what renders at each" — `app.routes.ts`.
- The navigation shell's visibility is derived from the route, not from a flag components pass around.
- Shop and Cards skeletons that a later design can fill in without restructuring anything around them.
- The in-game screen keeps exactly the viewport it has today.

**Non-Goals:**

- Any real Shop or Cards behavior — no pack purchasing, no currency, no persisted collection, no deck model. Those pages get static placeholder markup.
- Persisting a game across reloads. The in-game route redirects home on reload, and that is the accepted behavior for now (see Risks).
- Touching the card model, the card component, or the rules engine.
- Redesigning the Battle page's visuals. It is the existing splash, relocated.

## Decisions

### Route map

```
''            → redirect to 'battle'   (pathMatch: 'full')
'battle'      → Battle   (the current Home component)
'shop'        → Shop     (lazy)
'cards'       → Collection (lazy)
'game'        → Game     (canActivate: gameActiveGuard)
'style-guide' → StyleGuide (lazy, unchanged)
'**'          → redirect to 'battle'
```

`''` redirects to a named `battle` route rather than hosting the Battle component directly. The alternative — `{ path: '', component: Battle }` — leaves the default destination without a name, so the nav's "Battle" link, the wildcard redirect, and the guard's fallback would each have to refer to it as `''`. A named route means the active-link machinery and every redirect target agree on one string. The cost is that the URL reads `/battle` rather than `/`, which is fine for an app whose root is a game screen, not a document.

Shop, Cards, and the style guide are lazy; Battle and Game are eager. Battle is the first paint, and Game must appear the instant a battle starts, so neither should wait on a chunk. Shop and Cards are placeholders that most sessions will never open.

### The navigation shell is a component in the app shell, driven by the router

`app.html` becomes:

```html
<app-nav-shell />
<router-outlet />
```

`NavShell` decides its own visibility by watching the router, and renders nothing on the in-game route. Two alternatives were considered:

- *A layout route with a child outlet* (`{ path: '', component: NavShell, children: [...] }`, with `game` as a sibling outside it). This is the more idiomatic Angular structure and makes "which routes have chrome" a fact about the route tree. It was rejected because it nests every player-facing route one level deeper for a shell that is one element, and because the game route then has to sit outside the layout, splitting the route map into two shapes for a single boolean.
- *Each page rendering its own nav.* Rejected outright: three copies of the same markup, and the shell would remount on every navigation, killing any transition.

Visibility keys off **the route**, not `GameService.isActive()`. Those two are not the same predicate: a player can be on the Shop with a battle in progress, and the shell must show there. `navigation/shell` states the rule as "while the in-game screen is showing", which is a routing fact.

The shell yields the viewport by not rendering at all — `@if` in the template, not `display: none` and not `visibility: hidden` — so no space is reserved and the in-game screen's layout is byte-for-byte what it is today. This is what makes the CLAUDE.md constraints trivially still true rather than something to re-verify.

Active-destination marking uses `routerLinkActive` with `{ exact: false }` per link; nothing hand-rolled from the current URL.

### The in-game route is guarded by a functional `CanActivate`

```ts
export const gameActiveGuard: CanActivateFn = () =>
  inject(GameService).isActive() || inject(Router).createUrlTree(['/battle']);
```

Returning a `UrlTree` rather than `false` gives a redirect instead of a cancelled navigation that strands the user on a blank screen. The guard reads `isActive()` and starts nothing — required by `navigation/routing`'s "no game is started as a side effect".

Rejected: having the `Game` component itself redirect in a constructor or effect. That renders the component before deciding, which is exactly the empty board this is meant to prevent.

### Navigation on start and exit lives in the components, not in `GameService`

`Battle` calls `gameService.startGame()` then `router.navigate(['/game'])`. `Game`'s exit calls `gameService.exitGame()` then `router.navigate(['/battle'])`.

The alternative — folding the navigation into `startGame()`/`exitGame()` — would make the service depend on the `Router` and make every future caller (the Shop's "play with this deck", a test) navigate whether it wanted to or not. The service stays a pure state container; routing is the caller's concern. The pair is small enough not to warrant a facade.

Ordering matters on exit: clear the state *then* navigate, so the guard cannot see a stale active game.

### `Play` is deleted; `Home` becomes `Battle`

`Play` exists only to hold the `isActive()` toggle. With Battle and Game as separate routes there is nothing left for it to do, so `src/components/play/` goes.

`Home` moves to `src/components/battle/` and is renamed `Battle`, keeping its template and CSS as-is. Its `startGame` output stays — the component still just announces the intent; only the handler moves from `Play` into `Battle` itself. Keeping the folder named `home` while the route is `battle` would leave the codebase's only naming clue pointing at a concept the app no longer has.

### Shop and Cards are structurally identical placeholder screens

Both reuse the atmosphere and ornament primitives already in `primitives.css` (`.void-bg`, `.mist-layer`, `.particles`, `.corner`, `.ornament`) exactly the way `home.html` does. A placeholder that skips the theming would have to be rebuilt rather than filled in later, and would read as a different site.

Each is: atmosphere layers, a corner frame, a title, one line saying what the page will do, and a "coming soon" marker. No fake prices, no fake collection — `shop` and `collection` both require the placeholder not to present unreal data as real.

Neither imports `CardComponent` in this change. `collection`'s card-constraint requirement is a contract for when real cards appear, not a reason to render sample cards now.

The existing `OpenPack` component stays unrouted and untouched. It is the obvious seed for the Shop's real implementation, but wiring it in is the later Shop design's call, not this skeleton's.

## Risks / Trade-offs

- **A reload during a battle silently loses the game.** → Already true today; the guard makes it a clean redirect to the Battle page rather than a rendering error. Persisting `GameState` is deliberately out of scope, and `navigation/routing` codifies the redirect as the expected behavior so a future persistence change is an explicit spec change.
- **Navigating away mid-battle and back could confuse the game's turn timing.** `GameService.placeCard` schedules the opponent's move with a bare `setTimeout`. That timer keeps running while the player is on the Shop, so a returning player may find the opponent has already moved. → Acceptable: the state is a signal, so the board renders correctly on return; only the flip animation is missed. Worth a note in the later game-polish work, not a fix here.
- **URLs change: the game is no longer at `/`.** → No external links to preserve; the app has never been deployed with stable URLs. The wildcard route catches anything stale.
- **The nav shell is one more element competing for vertical space on short viewports** on the Battle, Shop, and Cards pages. → The in-game screen — the only one with hard no-clipping constraints — never renders it at all. The other three are static content that can scroll.
- **Deleting `Play` and renaming `Home` touches files the design-system change just settled.** → Both are moves, not rewrites: `home.css` travels with its component and its class names are unchanged, so the style guide's primitives keep resolving.
