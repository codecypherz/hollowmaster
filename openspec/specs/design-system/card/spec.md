## Purpose

Defines the single rendering contract for a Hollow Master card — its proportions, internal structure, directional chevrons, rarity and stat display, and its ownership and interaction states — so that every card in the application looks and behaves identically no matter which surface presents it.

## Requirements

### Requirement: Single card renderer

The application SHALL render every card through one shared card renderer. No surface may reimplement the card face in its own markup.

#### Scenario: The same card renders identically on different surfaces

- **WHEN** the same card is presented in a player's hand, on a board tile, and in an opened pack
- **THEN** all three render with identical structure, proportions, and internal layout

#### Scenario: Card markup is not duplicated

- **WHEN** any surface presents a card
- **THEN** it delegates to the shared card renderer
- **AND** it does not declare its own copy of the card face structure

#### Scenario: A card change applies everywhere at once

- **WHEN** the card renderer's structure or styling is changed
- **THEN** every surface presenting a card reflects that change

### Requirement: Trading-card aspect ratio

Every card SHALL render at a 2.5 : 3.5 aspect ratio. This ratio MUST hold at every size the card is rendered at, and for every card state including face-down opponent cards and board tiles.

#### Scenario: Aspect ratio holds at any size

- **WHEN** a card is rendered at any width
- **THEN** its height is that width multiplied by 3.5 / 2.5

#### Scenario: Face-down cards keep the ratio

- **WHEN** an opponent's face-down card is rendered
- **THEN** it has the same 2.5 : 3.5 aspect ratio as a face-up card

#### Scenario: Ratio survives viewport resizing

- **WHEN** the viewport is resized and cards are rescaled to fit
- **THEN** every card retains the 2.5 : 3.5 ratio at the new size

### Requirement: Three-section card face

A face-up card SHALL present exactly three stacked sections in order: a name section, an image section, and a stats section. Each section MUST be visually delineated from the others.

#### Scenario: Sections render in order

- **WHEN** a face-up card is rendered
- **THEN** the name section appears at the top, the image section in the middle, and the stats section at the bottom

#### Scenario: A long name does not break the layout

- **WHEN** a card's name is too long to fit its section
- **THEN** the name is truncated within the section
- **AND** the image and stats sections keep their positions and sizes

#### Scenario: A missing image does not collapse the section

- **WHEN** a card's artwork fails to load
- **THEN** the image section retains its allotted space
- **AND** the name and stats sections remain correctly positioned

### Requirement: Directional chevrons outside the sections

A card SHALL display its eight directional chevron positions within the card's outer border but outside the three content sections. Chevrons for directions the card possesses MUST be rendered as active and visually distinct from inactive positions.

#### Scenario: Chevrons sit between the border and the sections

- **WHEN** a card is rendered
- **THEN** its chevrons appear inside the card's outer border
- **AND** none of them overlaps the name, image, or stats section

#### Scenario: Active chevrons are distinguishable

- **WHEN** a card possesses a subset of the eight directions
- **THEN** the chevrons for those directions render in an active treatment
- **AND** the remaining positions render in a clearly dimmer inactive treatment

#### Scenario: All eight positions are represented

- **WHEN** a card is rendered
- **THEN** all eight compass positions are present in the layout regardless of which are active

### Requirement: Rarity rendered as stars

A card's rarity SHALL be rendered as a count of stars in the top-left corner of its image section, one star per rarity level. The rarity number MUST NOT be displayed as a numeral.

#### Scenario: Star count matches rarity

- **WHEN** a card of rarity N is rendered
- **THEN** N stars appear in the top-left corner of its image section

#### Scenario: Rarity numeral is never shown

- **WHEN** a card is rendered
- **THEN** no numeric representation of its rarity appears anywhere on the card

#### Scenario: Stars stay legible over artwork

- **WHEN** stars are rendered over card artwork of any brightness
- **THEN** they remain legible against that artwork

### Requirement: Stats rendered as bars without numerals

A card's attack and defense SHALL each be rendered as a progress bar filled proportionally on a 0-to-100 scale, accompanied by its stat icon. The numeric value of attack or defense MUST NOT appear on the card.

#### Scenario: Bar fill is proportional

- **WHEN** a card with an attack value of N is rendered
- **THEN** its attack bar is filled to N percent of the bar's width

#### Scenario: Stat numerals are never shown

- **WHEN** a card is rendered
- **THEN** no numeric attack or defense value appears anywhere on the card

#### Scenario: Attack and defense are distinguishable

- **WHEN** both stat bars are rendered
- **THEN** each is paired with its own icon
- **AND** the two bars are visually distinct from one another

#### Scenario: Stats are conveyed to assistive technology

- **WHEN** a screen reader encounters a card
- **THEN** the attack and defense values are available to it as accessible text
- **AND** that text is not rendered visually on the card

### Requirement: Ownership and interaction states

The card renderer SHALL support distinct visual states for player ownership, opponent ownership, selection, placeability, capture, and face-down presentation, and MUST NOT convey any of these states through color alone.

#### Scenario: Ownership is visible

- **WHEN** a card on the board is owned by the player versus the opponent
- **THEN** the two render with distinguishable owner treatments

#### Scenario: A selected card is identifiable

- **WHEN** a card in the player's hand is selected
- **THEN** it renders in a selected state distinguishable from unselected cards by more than color alone

#### Scenario: An unselectable card indicates so

- **WHEN** a card cannot be selected because it is not the player's turn
- **THEN** it renders in a subdued state and does not respond to hover as an actionable card

#### Scenario: Capture is signalled

- **WHEN** a card on the board changes ownership
- **THEN** a transition plays marking the change
- **AND** the card settles into the new owner's treatment

#### Scenario: A face-down card reveals nothing

- **WHEN** an opponent's face-down card is rendered
- **THEN** it shows the card back
- **AND** its name, artwork, rarity, stats, and chevrons are not discernible

### Requirement: Size parity across surfaces

Player cards, opponent cards, and board tiles SHALL all render at the same size within the game screen, and that size MUST be derived from one shared measurement so the three cannot diverge.

#### Scenario: Hands and board tiles match

- **WHEN** the game screen is rendered at any viewport size
- **THEN** player hand cards, opponent hand cards, and board tiles all have the same width and height

#### Scenario: Rescaling keeps parity

- **WHEN** the viewport is resized and the card size recalculates
- **THEN** all three continue to match one another at the new size

### Requirement: Card interactions are keyboard accessible

A card that is actionable SHALL be reachable and operable by keyboard, and MUST expose an accessible name and its selection state.

#### Scenario: Reaching a card by keyboard

- **WHEN** the user navigates with the keyboard
- **THEN** each actionable card receives focus in turn with a visible focus indicator

#### Scenario: Operating a card by keyboard

- **WHEN** an actionable card has focus and the user activates it
- **THEN** the same action occurs as when it is clicked

#### Scenario: Non-actionable cards are not focus targets

- **WHEN** a card is presented for display only
- **THEN** it is not reachable in the keyboard tab order
