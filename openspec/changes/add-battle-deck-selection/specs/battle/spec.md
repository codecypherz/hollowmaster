## MODIFIED Requirements

### Requirement: The control that begins a battle is never gated by the entrance

Activating the control that begins a battle SHALL be possible as soon as that control is visible,
and the entrance choreography SHALL NOT suppress, delay, or intercept that interaction. Activating
it SHALL take the player to the deck selection screen, as stated by `deck-selection`. It SHALL NOT
start a match itself.

#### Scenario: Clicking during the entrance

- **WHEN** the user activates the control that begins a battle while the entrance is still playing
- **THEN** the deck selection screen opens
- **AND** the activation is not swallowed by the animation

#### Scenario: The control does not start a match

- **WHEN** the user activates the control that begins a battle
- **THEN** no match is started until a deck is chosen and the battle is begun from deck selection

#### Scenario: Reduced motion is requested

- **WHEN** the user's system requests reduced motion
- **THEN** the Battle page renders in its finished state with every element visible
- **AND** the control that begins a battle is immediately available
