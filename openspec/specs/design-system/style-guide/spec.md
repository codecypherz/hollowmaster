## Purpose

Provides a single browsable page that renders every design token, primitive, and card state in the system, so the visual language can be reviewed in one place and unintended drift becomes immediately obvious.

## Requirements

### Requirement: Style guide is reachable at a dedicated route

The application SHALL expose the style guide at its own route, reachable without starting or interrupting a game.

#### Scenario: Navigating to the style guide

- **WHEN** the user navigates to the style guide route
- **THEN** the style guide renders

#### Scenario: The game flow is unaffected

- **WHEN** the user navigates to the application root
- **THEN** the existing home-then-game flow behaves exactly as before the style guide was added

#### Scenario: Viewing the guide does not disturb game state

- **WHEN** the user navigates to the style guide
- **THEN** no game is started, ended, or modified as a side effect

### Requirement: Complete token coverage

The style guide SHALL render every token in the system — each semantic color, each type role, each spacing step, each motion duration, and each elevation level — labelled with the token name that produces it.

#### Scenario: Colors are shown with their names

- **WHEN** the style guide renders the color section
- **THEN** every semantic color token appears as a swatch labelled with its token name

#### Scenario: Type roles are demonstrated

- **WHEN** the style guide renders the typography section
- **THEN** each type role is shown as sample text set in that role and labelled with its token name

#### Scenario: A new token appears automatically

- **WHEN** a token is added to the token set
- **THEN** the style guide renders it without requiring a separate hand-written entry

#### Scenario: Values shown match values used

- **WHEN** the style guide displays a token's value
- **THEN** that value is read from the live token set rather than transcribed

### Requirement: Primitive coverage

The style guide SHALL render every shared primitive, including each button variant in its resting, hover, focus, and disabled appearances, the ornamental divider, the corner framing, and the atmosphere layers.

#### Scenario: Button variants and states are shown

- **WHEN** the style guide renders the button section
- **THEN** each variant is shown
- **AND** its resting, hover, focus, and disabled appearances are each visible for comparison

#### Scenario: Ornaments are shown

- **WHEN** the style guide renders the ornament section
- **THEN** the divider and corner framing primitives are displayed

### Requirement: Card state coverage

The style guide SHALL render the card component in every state it supports: player-owned, opponent-owned, selected, unselectable, placeable, face-down, and captured, alongside an empty board tile.

#### Scenario: Every card state is displayed

- **WHEN** the style guide renders the card section
- **THEN** each supported card state appears as a labelled example

#### Scenario: Card constraints are verifiable on the page

- **WHEN** a reviewer inspects the card section
- **THEN** the aspect ratio, three-section structure, chevron placement, rarity stars, and numeral-free stat bars are all directly observable

#### Scenario: Rarity range is represented

- **WHEN** the style guide renders card examples
- **THEN** cards spanning the full range of rarity values are shown

### Requirement: The style guide is not part of the game experience

The style guide SHALL be a development reference only and MUST NOT be linked from, or alter, any player-facing screen.

#### Scenario: No player-facing entry point

- **WHEN** a player uses the home screen or the game screen
- **THEN** no navigation to the style guide is presented

#### Scenario: The guide adds no weight to the game screens

- **WHEN** the application loads the home or game screen
- **THEN** the style guide's own markup and styles are not required to render them
