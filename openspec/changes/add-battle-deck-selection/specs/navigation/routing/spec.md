## MODIFIED Requirements

### Requirement: The in-game screen has its own route

The in-game screen SHALL live at its own route, distinct from the Battle page's route and the deck
selection screen's route, so an active battle is addressable and appears in browser history as its
own entry.

#### Scenario: Starting a battle

- **WHEN** the user activates the control that begins a battle from the Battle page
- **THEN** the application navigates to the deck selection route and no game is started
- **AND** when the user then begins the battle from deck selection with a Ready deck chosen, a game
  is started
- **AND** the application navigates to the in-game route
- **AND** the in-game screen renders

#### Scenario: Leaving a battle

- **WHEN** the user leaves the battle from the in-game screen
- **THEN** the game is ended
- **AND** the application navigates back to the Battle page

## ADDED Requirements

### Requirement: Deck selection has its own route

The deck selection screen SHALL live at its own route, beneath the Battle page's, so the navigation
shows the Battle destination as current while the player chooses a deck. The route SHALL be directly
addressable. Reaching it SHALL NOT start, end, or alter a game. The browser's back control SHALL
return from it to the Battle page.

#### Scenario: Loading deck selection directly

- **WHEN** the user loads the deck selection route directly, without first visiting the Battle page
- **THEN** the deck selection screen renders
- **AND** no game is started

#### Scenario: The Battle destination is current

- **WHEN** the deck selection screen is shown
- **THEN** the navigation is present and marks the Battle destination as current

#### Scenario: Going back

- **WHEN** the user reaches deck selection from the Battle page and uses the browser's back control
- **THEN** the Battle page renders
