## ADDED Requirements

### Requirement: The Cards page draws no corner frame

The Cards page SHALL NOT draw the design system's corner-frame brackets at its edges or anywhere
else on the page. The page's atmosphere (the void background, the mist, and the soul particles)
SHALL remain.

#### Scenario: No corner brackets are drawn

- **WHEN** the Cards page renders at any supported viewport
- **THEN** no corner-frame bracket is present at any corner of the page

#### Scenario: The atmosphere remains

- **WHEN** the Cards page renders
- **THEN** its void background, mist, and soul particles are still drawn

### Requirement: The collection is aligned to its left edge

The collection's tiles SHALL be laid out from the left edge of the scrolling region in every order:
inside each rarity section and in the single run that the other orders present. A row with fewer
tiles than the region can hold SHALL leave its unused space on the right rather than sharing it
between the two sides. Every rarity section's heading and its first tile SHALL begin at the same
left edge.

#### Scenario: A short row sits against the left edge

- **WHEN** a rarity section holds fewer tiles than one row can fit
- **THEN** its first tile begins at the collection's left edge
- **AND** the unused width of the row lies to the right of its last tile

#### Scenario: Every order shares the left edge

- **WHEN** the collection is ordered by quantity, name, attack, or defense
- **THEN** its first tile begins at the same left edge that the rarity sections use

#### Scenario: Changing the order does not shift the grid sideways

- **WHEN** the player switches between the rarity order and any other order
- **THEN** the first tile's left edge stays in the same place

#### Scenario: Alignment holds under reduced motion

- **WHEN** the player has requested reduced motion
- **THEN** the section headings and tiles are left aligned exactly as they are otherwise

## MODIFIED Requirements

### Requirement: The rarity order groups the collection into a section per rating

While the collection is ordered by rarity, the page SHALL present it as one section per star rating
the collection holds, rather than as a single run of tiles. Each section SHALL hold every tile of
that rating and no other, and SHALL be headed by a label naming its rating, both as stars and in
words that assistive technology reads, such as `5 stars`. The heading SHALL be left aligned: its
label begins at the collection's left edge, and any decorative rule follows the label towards the
right rather than flanking it on both sides. The sections SHALL appear in the direction in effect:
highest rating first when descending, lowest first when ascending. Within a section, tiles SHALL
follow the order's tie-break. No section SHALL be presented for a rating the collection holds no
card of. Every other order SHALL present the collection as a single run with no section headings.

#### Scenario: Ordering by rarity sections the collection

- **WHEN** a player holding cards of one, two, and four stars orders the collection by rarity
- **THEN** three sections are presented, headed four stars, two stars, and one star, in that order
- **AND** each section holds exactly the tiles of its rating

#### Scenario: Section headings are left aligned

- **WHEN** a rarity section's heading is rendered
- **THEN** its label begins at the collection's left edge, level with the section's first tile
- **AND** no rule is drawn to the left of the label

#### Scenario: Reversing rarity reverses the sections

- **WHEN** the rarity order is reversed to ascending
- **THEN** the sections read one star, two stars, four stars
- **AND** the tiles within each section keep the same relative order they had when descending

#### Scenario: Ratings not held have no section

- **WHEN** the player holds no three-star card
- **THEN** no three-star section, heading, or gap is presented

#### Scenario: Section headings are announced in words

- **WHEN** assistive technology reads a section's heading
- **THEN** it announces the rating in words, such as `4 stars`

#### Scenario: Other orders are not sectioned

- **WHEN** the collection is ordered by quantity, name, attack, or defense
- **THEN** it is presented as one run of tiles with no section headings

#### Scenario: Sections arrive with the page

- **WHEN** the player navigates to the Cards page
- **THEN** the collection is already presented in rarity sections, rarest first

### Requirement: A collection tile states how many copies are held

Each collection tile SHALL display, as a badge overlaying the bottom of the tile, the number of
copies of that card the collection holds and, while a deck is selected, the number of those copies
the selected deck uses. The badge SHALL be shown for every tile, including a card held once and a
card the deck does not use. Its wording or layout SHALL make clear which number is held and which
is used, for example `2 / 3` with the used number first and visually subordinate to the held
number. Where the two numbers are parted by a separator, such as the `/`, the separator SHALL be
plainly visible at the badge's size, in both the normal and the exhausted treatment: drawn with
at least the stroke weight and contrast of the used number, rather than as a faint hairline. Its
accessible name SHALL state both in words, such as `2 of 3 in Deck 1`. Where every held copy is
used, the badge SHALL show that the card is exhausted for this deck by a cue beyond colour. Where
no deck is selected, the badge SHALL state only the held count.

The badge MUST NOT obscure the card's name, its star track, either stat bar, or any of its eight
chevrons. It SHALL follow the collection and the selected deck without the page being reloaded,
including when the player switches decks.

#### Scenario: A duplicate is counted

- **WHEN** a card the player holds three copies of, two of which the selected deck uses, is
  presented
- **THEN** its badge states that two of three are used
- **AND** its accessible name states two of three in the selected deck

#### Scenario: The separator is legible

- **WHEN** a badge showing a used and a held count is rendered, in either the normal or the
  exhausted treatment
- **THEN** the separator between the two numbers is plainly visible against the badge's background
- **AND** it is drawn at no lighter a weight and no lower a contrast than the used number

#### Scenario: A single copy is counted too

- **WHEN** a card the player holds one copy of, which the selected deck does not use, is presented
- **THEN** its badge states zero used of one held rather than being omitted

#### Scenario: An exhausted card is marked

- **WHEN** the selected deck uses every held copy of a card
- **THEN** the badge marks the card as exhausted for this deck by a cue that survives colour removal

#### Scenario: Switching decks updates the used count

- **WHEN** the player switches from a deck using two copies of a card to a deck using none
- **THEN** that card's badge changes from two used to zero used

#### Scenario: No deck states held only

- **WHEN** the player holds no decks
- **THEN** each badge states the held count and no used count

#### Scenario: The badge obscures nothing

- **WHEN** a tile's badge is rendered
- **THEN** the card's name, all five star slots, both stat bars with their labels, and all eight
  chevrons remain visible and legible

#### Scenario: The count follows the collection

- **WHEN** the player gains another copy of a card they already hold
- **THEN** that card's badge states the new held count without the page being reloaded
