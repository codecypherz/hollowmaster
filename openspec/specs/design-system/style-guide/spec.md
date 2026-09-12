## Purpose

Provides a single browsable page that renders every design token, primitive, and card state in the system, so the visual language can be reviewed in one place and unintended drift becomes immediately obvious.

## Requirements

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

The style guide SHALL render every shared primitive, including each button variant in its resting, hover, focus, and disabled appearances, the ornamental divider, the corner framing, the atmosphere layers, and the Geo amount.

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

### Requirement: Card and card-face coverage

The style guide SHALL render the card component in every state it supports: player-owned, opponent-owned, selected, unselectable, placeable, face-down, and captured, alongside an empty board tile. It SHALL additionally demonstrate the card's size-dependent behavior and its full star range, so that both are reviewable without running the game.

#### Scenario: Every card state is displayed

- **WHEN** the style guide renders the card section
- **THEN** each supported card state appears as a labelled example

#### Scenario: Card constraints are verifiable on the page

- **WHEN** a reviewer inspects the card section
- **THEN** the aspect ratio, four-section structure, chevron placement, star track, labelled numeral-free stat bars, and the bordered ability section with its set/number plate are all directly observable

#### Scenario: The star range is represented

- **WHEN** the style guide renders card examples
- **THEN** cards spanning the full range of star ratings are shown

#### Scenario: The ability gate is demonstrated on both sides of the threshold

- **WHEN** the style guide renders the card size ladder
- **THEN** at least one example is narrower than the ability section's threshold and at least one is at or above it
- **AND** a reviewer can see the ability section absent in the first and present in the second

#### Scenario: The size ladder starts at the minimum supported width

- **WHEN** the style guide renders the card size ladder
- **THEN** its narrowest example is the card's minimum supported width
- **AND** no example is narrower than that minimum

#### Scenario: The minimum supported width is inspectable

- **WHEN** a reviewer inspects the size ladder's narrowest example
- **THEN** the card's legibility at its minimum supported width can be judged directly

#### Scenario: The star track is demonstrated at every rating

- **WHEN** the style guide renders the star examples
- **THEN** ratings 1 through 6 are each shown at a size where the star track is legible
- **AND** the unlit slots are visible on every rating below 5
- **AND** the sixth star's distinct treatment is visible on the 6-star example and absent from every other

#### Scenario: The frame does not vary with rarity

- **WHEN** the style guide renders cards of differing star ratings side by side at the same size
- **THEN** their frames are identical
- **AND** the page presents no per-rarity frame treatment to compare

#### Scenario: Examples exist for ratings the card database lacks

- **WHEN** the card database contains no card at some rating in the 1-to-6 range
- **THEN** the style guide still shows that rating's star track

#### Scenario: Stat bars are demonstrated across the value range

- **WHEN** the style guide renders the card section
- **THEN** examples at low, middling, and high stat values are shown
- **AND** a reviewer can confirm that both the label and the fill read at each

#### Scenario: Name fitting is demonstrated

- **WHEN** the style guide renders the card section
- **THEN** examples with a short name and with a name long enough to be shrunk and wrapped are shown
- **AND** a reviewer can confirm that neither is truncated

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

### Requirement: Sealed pack coverage

The style guide SHALL render the pack component in both states it supports — sealed and torn — so
that the wrapper's craft is reviewable without buying a pack. It SHALL additionally demonstrate the
pack at its minimum supported width, so that the legibility promised there can be judged directly.

#### Scenario: Both pack states are displayed

- **WHEN** the style guide renders the pack section
- **THEN** a sealed pack and a torn pack each appear as a labelled example

#### Scenario: Pack craft is verifiable on the page

- **WHEN** a reviewer inspects the pack section
- **THEN** the crimped top and bottom edges, the edge trim, the foil sheen, the centred artwork, and the tier name printed across the top of the face are all directly observable

#### Scenario: The minimum supported width is inspectable

- **WHEN** the style guide renders the pack section
- **THEN** an example at the pack's minimum supported width is shown
- **AND** no example is narrower than that minimum

#### Scenario: Every tier's wrapper is shown

- **WHEN** the style guide renders the pack section
- **THEN** each pack tier the catalogue offers appears with its own printed name
