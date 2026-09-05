## Purpose

Defines the application's route map — which URL renders which screen, which screen answers to the default route, and how starting or leaving a battle moves the player between them — so every area of the site is independently addressable and the browser's own history and back button behave sensibly.

## ADDED Requirements

### Requirement: The default route is the Battle page

The application SHALL render the Battle page at the root route. The Battle page SHALL present the game's title identity and an explicit control that begins a battle.

#### Scenario: Loading the application

- **WHEN** the user loads the application at the root route with no battle in progress
- **THEN** the Battle page renders
- **AND** a control to begin a battle is presented

#### Scenario: An unknown route

- **WHEN** the user navigates to a route the application does not define
- **THEN** the application redirects to the Battle page rather than rendering an empty screen

### Requirement: Each destination has its own route

The application SHALL expose the Battle page, the Shop page, and the Cards page each at its own distinct route.

#### Scenario: Navigating to the Shop

- **WHEN** the user navigates to the Shop route
- **THEN** the Shop page renders

#### Scenario: Navigating to the Cards page

- **WHEN** the user navigates to the Cards route
- **THEN** the Cards page renders

#### Scenario: A destination is directly addressable

- **WHEN** the user loads the Shop route or the Cards route directly, without first visiting the Battle page
- **THEN** that page renders

### Requirement: The in-game screen has its own route

The in-game screen SHALL live at its own route, distinct from the Battle page's route, so an active battle is addressable and appears in browser history as its own entry.

#### Scenario: Starting a battle

- **WHEN** the user activates the control that begins a battle from the Battle page
- **THEN** a game is started
- **AND** the application navigates to the in-game route
- **AND** the in-game screen renders

#### Scenario: Leaving a battle

- **WHEN** the user leaves the battle from the in-game screen
- **THEN** the game is ended
- **AND** the application navigates back to the Battle page

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

- **WHEN** the user navigates from the in-game route to the Shop or the Cards page
- **THEN** that page renders
- **AND** returning to the in-game route renders the battle still in progress

### Requirement: Navigation preserves page state boundaries

Navigating between the Battle, Shop, and Cards pages SHALL NOT start, end, or otherwise modify a game.

#### Scenario: Browsing without a battle

- **WHEN** the user moves between the Battle, Shop, and Cards pages
- **THEN** no game is started or ended

#### Scenario: Browsing during a battle

- **WHEN** the user moves between the Shop and Cards pages while a battle is in progress
- **THEN** the battle in progress is neither ended nor altered
