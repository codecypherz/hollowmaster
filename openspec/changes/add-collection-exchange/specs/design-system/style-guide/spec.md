## MODIFIED Requirements

### Requirement: Style guide is reachable at a dedicated route

The application SHALL expose the style guide at its own route, reachable without starting or interrupting a game.

#### Scenario: Navigating to the style guide

- **WHEN** the user navigates to the style guide route
- **THEN** the style guide renders

#### Scenario: The game flow is unaffected

- **WHEN** the user navigates to the application root, the Shop route, the Decks route, the Collection route, or the in-game route
- **THEN** each behaves exactly as its own specification defines, unchanged by the style guide's presence

#### Scenario: Viewing the guide does not disturb game state

- **WHEN** the user navigates to the style guide
- **THEN** no game is started, ended, or modified as a side effect

### Requirement: Primitive coverage

The style guide SHALL render every shared primitive, including:

- each button variant in its resting, hover, focus, and disabled appearances
- the ornamental divider
- the corner framing
- the atmosphere layers
- the Geo amount
- the Rosary amount
- the single-line screen header

#### Scenario: Button variants and states are shown

- **WHEN** the style guide renders the button section
- **THEN** each variant is shown
- **AND** its resting, hover, focus, and disabled appearances are each visible for comparison

#### Scenario: Ornaments are shown

- **WHEN** the style guide renders the ornament section
- **THEN** the divider and corner framing primitives are displayed

#### Scenario: The Geo amount is shown

- **WHEN** the style guide renders the Geo amount
- **THEN** amounts spanning the range the application shows — including zero — appear as amount followed by the Geo mark
- **AND** the same primitive is shown at the type sizes it is used at, including inside a button

#### Scenario: The Rosary amount is shown

- **WHEN** the style guide renders the Rosary amount
- **THEN** amounts spanning the range the application shows, including zero, appear as amount
  followed by the Rosary mark
- **AND** the same primitive is shown at the type sizes it is used at, including inside an enabled
  and a disabled button
- **AND** it is shown beside a Geo amount, so a reviewer can compare the two marks

#### Scenario: The single-line screen header is shown

- **WHEN** the style guide renders the header section
- **THEN** the single-line screen header appears as a labelled example with a sample title
- **AND** it is also shown in a narrow container, so a reviewer can see the rules shorten while the
  title stays on one line, unwrapped and at full size

#### Scenario: The header example does not compete with the page's own heading

- **WHEN** the style guide renders the single-line screen header example
- **THEN** the example does not replace or duplicate the style guide's own top-level heading for
  assistive technology

### Requirement: The style guide is not part of the game experience

The style guide SHALL be a development reference only and MUST NOT be linked from, or alter, any player-facing screen — including the navigation shell.

#### Scenario: No player-facing entry point

- **WHEN** a player uses the Battle page, the Shop page, the Decks page, the Collection page, or the in-game screen
- **THEN** no navigation to the style guide is presented

#### Scenario: The navigation shell does not offer it

- **WHEN** the navigation shell renders its destinations
- **THEN** the style guide is not among them

#### Scenario: The guide adds no weight to the game screens

- **WHEN** the application loads any player-facing screen
- **THEN** the style guide's own markup and styles are not required to render it
