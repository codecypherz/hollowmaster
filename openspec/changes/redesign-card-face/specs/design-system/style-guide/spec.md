## MODIFIED Requirements

### Requirement: Card state coverage

The style guide SHALL render the card component in every state it supports: player-owned, opponent-owned, selected, unselectable, placeable, face-down, and captured, alongside an empty board tile. It SHALL additionally demonstrate the card's size-dependent behavior and its full rarity range, so that both are reviewable without running the game.

#### Scenario: Every card state is displayed

- **WHEN** the style guide renders the card section
- **THEN** each supported card state appears as a labelled example

#### Scenario: Card constraints are verifiable on the page

- **WHEN** a reviewer inspects the card section
- **THEN** the aspect ratio, four-section structure, chevron placement, star track, labelled numeral-free stat bars, and the ability section with its set/number plate are all directly observable

#### Scenario: Rarity range is represented

- **WHEN** the style guide renders card examples
- **THEN** cards spanning the full range of rarity values are shown

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

#### Scenario: The rarity frame treatments are comparable side by side

- **WHEN** the style guide renders the rarity section
- **THEN** the frame treatment for each rarity is shown alongside the others at the same size

#### Scenario: Examples exist for ratings the card database lacks

- **WHEN** the card database contains no card at some rating in the 1-to-6 range
- **THEN** the style guide still shows that rating's star track and frame treatment
