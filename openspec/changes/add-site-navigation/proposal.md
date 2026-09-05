## Why

Hollow Master currently has exactly one player-facing screen: the root route renders a title splash that swaps itself for the game board once a battle starts. There is nowhere to buy packs, nowhere to view a collection, and no way to move between screens. Before pack-buying and deck-building can be designed in earnest, the site needs a navigation skeleton that gives each of those areas a real route and a consistent way to reach it.

## What Changes

- The default route (`/`) becomes the **Battle** page. It keeps the existing Hollow Knight title splash and its "Start Game" control, now framed as the entry point to a battle rather than as a generic home screen.
- A new **Shop** route is added for buying packs of cards. This change delivers a themed skeleton with placeholder content only — the purchasing design comes later.
- A new **Cards** route is added for viewing the collection and building decks. This change delivers a themed skeleton with placeholder content only — the collection and deck-builder designs come later.
- The in-game screen gets **its own route** rather than remaining a state toggle inside the root route. Starting a battle navigates to it; leaving the battle navigates back to `/`. The route is guarded so that reaching it without an active game redirects to the Battle page rather than rendering an empty board.
- A persistent **navigation shell** wraps Battle, Shop, and Cards, presenting the three destinations and marking the active one. The shell is **hidden while a battle is in progress**, so the in-game screen keeps the whole viewport — required by the project's in-game layout constraints (no clipping, maximum use of space, all cards and board tiles always visible).
- **BREAKING (internal):** the `Play` component's "splash or game, decided by `GameService.isActive()`" pattern is retired. The two screens become separate routed components, and `GameService` gains the notion of navigating on start/exit.
- The `style-guide` route stays a lazy, development-only reference and stays absent from the navigation shell.

## Capabilities

### New Capabilities

- `navigation/routing`: The application's route map — which URL renders which screen, the default route, the guarded in-game route, and how starting and leaving a battle move between them.
- `navigation/shell`: The persistent navigation chrome shared by the out-of-battle pages — destinations offered, active-destination indication, and the rule that it yields the viewport during a battle.
- `shop`: The Shop page — its route, its themed skeleton, and the placeholder content standing in for the pack-purchasing experience.
- `collection`: The Cards page — its route, its themed skeleton, and the placeholder content standing in for collection viewing and deck building.

### Modified Capabilities

- `design-system/style-guide`: Its "The game flow is unaffected" scenario asserts that navigating to the application root behaves "exactly as before the style guide was added" — i.e. the home-then-game toggle at `/`. That flow is being replaced by separate Battle and in-game routes, so the scenario is restated in terms of the new route map. The requirement that the guide remain unlinked from player-facing screens is unchanged and now also covers the navigation shell.

## Impact

- **Routing**: `src/app/app.routes.ts` gains routes for shop, cards, and the in-game screen; `''` is repointed at the Battle page.
- **App shell**: `src/app/app.html` / `app.ts` host the navigation shell around the router outlet.
- **Components**: `src/components/play/` is retired; `src/components/home/` becomes the Battle page; new `src/components/shop/`, `src/components/collection/`, and a navigation shell component are added.
- **Services**: `src/services/game.service.ts` — `startGame()` and `exitGame()` become the transitions the in-game route keys off; a route guard reads `isActive()`.
- **Styles**: navigation chrome is built from the existing tokens and primitives in `src/styles/`; no new design tokens are expected.
- **Specs**: `openspec/specs/design-system/style-guide/spec.md` is amended.
- **Not affected**: the card model and `CARD_DB`, the card component, the game rules engine, and the existing `open-pack` component (which is not currently routed and stays that way until the Shop design lands).
