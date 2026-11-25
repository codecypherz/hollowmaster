## MODIFIED Requirements

### Requirement: Each card is framed beneath its collection number

Every tile SHALL draw a visible frame around its card. Inside the frame, from top to bottom, SHALL
be the card's collection number, the card, its held or not-owned badge, the Sell row, and the Buy
row. The collection number SHALL be the card's set code followed directly by a pound sign and its
number within the set, with no space and no padding, such as `FC#1`, at the frame's top left. The
collection number and the rows belong to the frame and MUST NOT be drawn inside or over the card. The
card within the frame SHALL be drawn exactly as the shared card renderer draws it, at a width that satisfies the
requirement that a tile render its card without its ability text. Every tile SHALL have the same
size, whatever is held or pending.

#### Scenario: The frame's contents read in order

- **WHEN** a tile is rendered
- **THEN** its collection number, card, badge, Sell row, and Buy row appear in that order inside one
  visible frame

#### Scenario: The collection number is not padded

- **WHEN** the first and the tenth Forgotten Crossroads cards' tiles are rendered
- **THEN** their frames read `FC#1` and `FC#10`

#### Scenario: The frame leaves the card alone

- **WHEN** a framed card is rendered
- **THEN** no part of the collection number or of either row overlaps the card
- **AND** the card's structure, proportions, and internal layout are those the renderer gives it at
  that width

#### Scenario: Tiles share one size

- **WHEN** tiles for an unowned card, a card held twelve times, and a card with a warned pending
  sale are rendered
- **THEN** all three frames have the same width and height

### Requirement: The Sell and Buy rows are segmented bars showing their price

Each row SHALL draw its minus control, quantity field, plus control, and nine-copies control as one
joined bar through the design system's segmented control, sharing edges rather than standing apart.
The Sell row's bar SHALL be gold accented and the Buy row's soul accented. The two rows SHALL also
be told apart by their visible labels, `Sell` and `Buy`, so that neither relies on colour. Under
each label the row SHALL show its price per copy through the Rosary amount primitive. The label and
the price SHALL each be centred horizontally in the column they share, which is the space between the
frame's left edge and the bar's. A price is centred as a whole, its amount and its mark together. A
warning mark beside the label SHALL NOT count towards its centring. The two bars
SHALL share the same left and right edges and the same segment widths on every tile. No part of a
row SHALL be clipped or overlap another for any price in the rate table and any quantity of up to
three digits. A row whose plus control is unavailable SHALL remain legible.

Where the player does not know the rate of a card's rarity, its rows SHALL show no price, keeping
the space it would take, and SHALL give assistive technology no price.

#### Scenario: A row is one bar

- **WHEN** a tile is rendered
- **THEN** each row's minus control, quantity field, plus control, and nine-copies control are
  adjacent with no space between them

#### Scenario: Prices are visible

- **WHEN** a four-star card's tile is rendered
- **THEN** its Sell row shows 33 and its Buy row shows 99, each followed by the Rosary mark

#### Scenario: The label and price are centred

- **WHEN** tiles with prices of one to three digits are rendered
- **THEN** every `Sell` and `Buy` label, and every price with its mark, is centred between the frame's
  left edge and the bar's left edge

#### Scenario: A warning does not move the label

- **WHEN** a Sell row comes to carry a warning mark
- **THEN** its label and its price stay centred where they were
- **AND** the mark overlaps neither the label nor the bar

#### Scenario: The bars line up

- **WHEN** tiles with different prices and pending quantities are rendered
- **THEN** every bar begins and ends at the same place within its frame

#### Scenario: Sell and Buy without colour

- **WHEN** a tile is rendered with colour removed
- **THEN** the Sell row and the Buy row can still be told apart

#### Scenario: A rate not yet known

- **WHEN** a six-star card's tile is presented to a player who does not know the rarity 6 rate
- **THEN** neither row shows or announces a price
- **AND** the tile has the same size as every other
