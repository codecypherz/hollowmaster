## MODIFIED Requirements

### Requirement: Style guide is reachable at a dedicated route

The application SHALL expose the style guide at its own route, reachable without starting or interrupting a game.

#### Scenario: Navigating to the style guide

- **WHEN** the user navigates to the style guide route
- **THEN** the style guide renders

#### Scenario: The game flow is unaffected

- **WHEN** the user navigates to the application root, the Shop route, the Cards route, or the in-game route
- **THEN** each behaves exactly as its own specification defines, unchanged by the style guide's presence

#### Scenario: Viewing the guide does not disturb game state

- **WHEN** the user navigates to the style guide
- **THEN** no game is started, ended, or modified as a side effect

### Requirement: The style guide is not part of the game experience

The style guide SHALL be a development reference only and MUST NOT be linked from, or alter, any player-facing screen — including the navigation shell.

#### Scenario: No player-facing entry point

- **WHEN** a player uses the Battle page, the Shop page, the Cards page, or the in-game screen
- **THEN** no navigation to the style guide is presented

#### Scenario: The navigation shell does not offer it

- **WHEN** the navigation shell renders its destinations
- **THEN** the style guide is not among them

#### Scenario: The guide adds no weight to the game screens

- **WHEN** the application loads any player-facing screen
- **THEN** the style guide's own markup and styles are not required to render it
