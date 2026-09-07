## ADDED Requirements

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

## REMOVED Requirements

### Requirement: Card state coverage

**Reason**: The requirement is restated as "Card and card-face coverage" above. The frame no longer varies with rarity, so the scenario comparing per-rarity frame treatments side by side has nothing left to compare, and the guide gains coverage of the two card-face behaviours this change introduces — stat readability across the value range and name fitting. Every state, size-ladder, ability-gate, and star-track scenario carries over unchanged.

**Migration**: Read the restated requirement. Replace the rarity-frames gallery with a star-track comparison that also evidences the frames being identical across ratings, and add stat-value and name-length examples to the card section.
