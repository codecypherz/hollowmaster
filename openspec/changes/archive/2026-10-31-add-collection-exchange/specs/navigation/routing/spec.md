## MODIFIED Requirements

### Requirement: The in-game route requires an active game

The in-game route SHALL only render when a game is in progress. Reaching it with no game in progress SHALL redirect to the Battle page.

#### Scenario: Reaching the in-game route with no game

- **WHEN** the user navigates directly to the in-game route and no game is in progress
- **THEN** the application redirects to the Battle page
- **AND** no game is started as a side effect

#### Scenario: Reloading during a battle

- **WHEN** the user reloads the browser while on the in-game route
- **THEN** the application redirects to the Battle page, because no game survives the reload

#### Scenario: Navigating away during a battle

- **WHEN** the user navigates from the in-game route to the Shop, the Decks page, or the Collection
  page
- **THEN** that page renders
- **AND** returning to the in-game route renders the battle still in progress

### Requirement: Navigation preserves page state boundaries

Navigating between the Battle, Shop, Decks, and Collection pages SHALL NOT start, end, or otherwise
modify a game.

#### Scenario: Browsing without a battle

- **WHEN** the user moves between the Battle, Shop, Decks, and Collection pages
- **THEN** no game is started or ended

#### Scenario: Browsing during a battle

- **WHEN** the user moves between the Shop, Decks, and Collection pages while a battle is in
  progress
- **THEN** the battle in progress is neither ended nor altered

## ADDED Requirements

### Requirement: Each out-of-battle page has its own route

The application SHALL expose the Battle page, the Shop page, the Decks page, and the Collection
page each at its own distinct route. The Decks page's route SHALL be named for it. The route the
Decks page was reached at while it was called the Cards page SHALL redirect to the Decks page, so
an address saved before the rename still lands where it used to.

#### Scenario: Navigating to the Shop

- **WHEN** the user navigates to the Shop route
- **THEN** the Shop page renders

#### Scenario: Navigating to the Decks page

- **WHEN** the user navigates to the Decks route
- **THEN** the Decks page renders

#### Scenario: Navigating to the Collection page

- **WHEN** the user navigates to the Collection route
- **THEN** the Collection page renders

#### Scenario: The former Cards route redirects

- **WHEN** the user navigates to the route the Cards page used to live at
- **THEN** the application redirects to the Decks route and the Decks page renders

#### Scenario: A destination is directly addressable

- **WHEN** the user loads the Shop route, the Decks route, or the Collection route directly,
  without first visiting the Battle page
- **THEN** that page renders

## REMOVED Requirements

### Requirement: Each destination has its own route

**Reason**: The Cards page is renamed the Decks page and a fourth destination, the Collection page, is added. The requirement is restated with that set of pages and with a redirect from the former Cards route.

**Migration**: See "Each out-of-battle page has its own route". The Cards route now redirects to the Decks route.
