## MODIFIED Requirements

### Requirement: The Rosary purse sits in the top-right corner of the page

The Collection page SHALL show the player's current Rosary balance in the top-right corner of the
page, rendered through the Rosary amount primitive. The balance SHALL be shown whenever the page is
shown, including when it is zero. It SHALL show the user's actual balance, unaffected by anything
pending in the cart, and SHALL update as soon as that balance changes, without the page being
reloaded. The purse MUST NOT overlap the screen header's title. It SHALL stay in place while the
sections scroll, and assistive technology SHALL announce it as the player's Rosaries.

#### Scenario: The purse is in the top-right corner

- **WHEN** the Collection page renders at any viewport size it supports
- **THEN** the Rosary balance is shown at the top-right of the page
- **AND** it does not overlap the page's title

#### Scenario: A zero balance is shown as zero

- **WHEN** a new player views the Collection page
- **THEN** the purse shows zero followed by the Rosary mark rather than being hidden or left blank

#### Scenario: The purse follows an exchange

- **WHEN** the player adds a sale to the cart and then confirms the cart
- **THEN** the purse is unchanged while the sale is pending and rises by the sale's amount on
  confirmation
- **AND** the change does not need the page to be reloaded

#### Scenario: The purse stays put while the sections scroll

- **WHEN** the player scrolls the sections
- **THEN** the purse remains visible in place

### Requirement: The Collection page presents one section per card set

The Collection page SHALL present one section for each named card set, in the order the sets are
stated. Each section SHALL be headed by the set's display name, such as `Forgotten Crossroads`. The
heading SHALL state how much of the set the player has collected, as the number of the set's
distinct cards held at least once and the number of cards the set holds, such as `9 / 15`. Its
accessible name SHALL put that in words, such as `9 of 15 collected`. Cards pending in the cart
SHALL NOT affect it. A named set the catalogue holds no cards for SHALL still be presented as a
section headed by its name and marked as forthcoming. It SHALL present no tiles, prices, or
controls.

#### Scenario: Each set has its own section

- **WHEN** the Collection page renders
- **THEN** a section headed `Forgotten Crossroads` is presented
- **AND** each named set has exactly one section, in the stated set order

#### Scenario: The heading states progress

- **WHEN** a player holding nine of the fifteen Forgotten Crossroads cards views that section
- **THEN** its heading states `9 / 15`
- **AND** assistive technology reads it as nine of fifteen collected

#### Scenario: Progress counts distinct cards, not copies

- **WHEN** the player holds three copies of one Forgotten Crossroads card and none of the others
- **THEN** that section's progress states one collected

#### Scenario: Progress follows an exchange

- **WHEN** the player confirms a cart that buys a card of a set they did not hold any copy of
- **THEN** that set's progress rises by one without the page being reloaded
- **AND** when they confirm a cart that sells their last copy of it, the progress falls by one

#### Scenario: A set with no cards yet is forthcoming

- **WHEN** a named set holds no catalogued cards
- **THEN** its section is presented, headed by its name and marked as forthcoming
- **AND** it presents no tile, price, or exchange control

### Requirement: A tile distinguishes owned cards from unowned ones

A tile for a card the player holds SHALL show, as a badge over the bottom of the card, how many
copies are held, including a single copy. Its accessible name SHALL state the count in words, such
as `3 held`. A tile for a card the player does not hold SHALL be marked as not owned, both by a
visual treatment that recedes the card and by a cue that survives colour removal, such as a `Not
owned` label in place of the count. Its accessible name SHALL state that the card is not owned. The
marks SHALL follow the collection without the page being reloaded, and SHALL NOT be affected by what
is pending in the cart. They MUST NOT obscure the card's name, its star track, either stat bar, or
any of its eight chevrons, and the treatment that recedes the card MUST NOT cover the tile's
collection number or its rows.

#### Scenario: A held card states its count

- **WHEN** a card the player holds three copies of is presented
- **THEN** its tile states three held

#### Scenario: A single copy is counted too

- **WHEN** a card the player holds one copy of is presented
- **THEN** its tile states one held rather than omitting the count

#### Scenario: An unowned card is marked without relying on colour

- **WHEN** a card the player holds no copy of is presented, with colour removed
- **THEN** it can still be identified as not owned
- **AND** assistive technology announces it as not owned

#### Scenario: Buying the first copy marks it owned

- **WHEN** the player confirms a cart that buys one copy of a card they did not hold
- **THEN** its tile stops being marked as not owned and states one held

#### Scenario: Selling the last copy marks it unowned

- **WHEN** the player confirms a cart that sells their only copy of a card
- **THEN** its tile is marked as not owned

#### Scenario: Pending cards do not change the count

- **WHEN** a player holding two copies of a card has one of them pending for sale
- **THEN** its tile still states two held

#### Scenario: The marks obscure nothing

- **WHEN** a tile's count badge or not-owned mark is rendered
- **THEN** the card's name, all five star slots, both stat bars with their labels, and all eight
  chevrons remain visible and legible

### Requirement: The Collection page fits the viewport

The Collection page SHALL fit within the viewport without clipping its content and SHALL make use
of the space available to it. The page itself SHALL NOT scroll in either axis. The sections SHALL be
the only region that scrolls, and the header, the cart control, and the purse SHALL keep their
place. Tiles SHALL be laid out from the left edge of the scrolling region. A row with fewer tiles
than the region holds SHALL leave its unused space on the right. Every section's heading SHALL begin
at the same left edge as its first tile.

#### Scenario: The page itself does not scroll

- **WHEN** the Collection page is rendered at any viewport size it supports
- **THEN** the document scrolls neither horizontally nor vertically
- **AND** its content is fully visible without being clipped

#### Scenario: Only the sections scroll

- **WHEN** the sections hold more tiles than their region can show
- **THEN** that region scrolls
- **AND** the header, the cart control, and the purse stay where they are

#### Scenario: A short row sits against the left edge

- **WHEN** a section holds fewer tiles than one row can fit
- **THEN** its heading and its first tile begin at the region's left edge
- **AND** the unused width of the row lies to the right of its last tile

### Requirement: Every action on the Collection page is operable by keyboard

The cart control and every control in a tile's Sell and Buy rows SHALL be reachable and operable by
keyboard, with a visible focus indicator. That includes an unavailable control, which SHALL remain
focusable, so that focus is not lost when an activation makes the activated control unavailable, and
so that its reason can be read where it has one. The order in which controls receive focus SHALL
follow the page's reading order: the cart control, then the sections and their tiles, and within a
tile the Sell row and then the Buy row.

#### Scenario: Buying and selling without a pointer

- **WHEN** the player, using only the keyboard, raises one card's buy quantity and another's sell
  quantity, opens the cart, and confirms it
- **THEN** the first card is bought and the second is sold
- **AND** each control showed a visible focus indicator when focused

#### Scenario: Focus survives reaching a bound

- **WHEN** the player activates a tile's sell plus control until every copy held is pending
- **THEN** the control becomes unavailable and still holds focus

#### Scenario: The unavailable control can be focused

- **WHEN** a player holding nine or fewer copies of a card tabs to its `↓9` control
- **THEN** the control receives focus and its reason is available

### Requirement: The Collection page honours a reduced-motion preference

Where the player's environment asks for reduced motion, the page's entrances and transitions,
including the tiles' arrival and any feedback on a count, a pending quantity, the cart control, or
the purse changing, SHALL be reduced to an immediate state change. Every state the motion would have
carried SHALL remain distinguishable without it.

#### Scenario: Motion is removed, not the information

- **WHEN** the Collection page is used with a reduced-motion preference expressed
- **THEN** tiles, the cart control, and the purse appear without animation
- **AND** owned and unowned tiles, counts, pending quantities, and the unavailable and warning
  treatments are all still distinguishable

## ADDED Requirements

### Requirement: Each card sits in a frame headed by its collection number

Every tile SHALL draw a visible frame around its card. Inside the frame, from top to bottom, SHALL
be the card's collection number, the card, its held or not-owned badge, the Sell row, and the Buy
row. The collection number SHALL be the card's set code followed by its number within the set padded
to three digits, such as `FC 001`, at the frame's top left. The collection number and the rows belong
to the frame and MUST NOT be drawn inside or over the card. The card within the frame SHALL be drawn
exactly as the shared card renderer draws it, at a width that satisfies the requirement that a tile
render its card without its ability text. Every tile SHALL have the same size, whatever is held or
pending.

#### Scenario: The frame's contents read in order

- **WHEN** a tile is rendered
- **THEN** its collection number, card, badge, Sell row, and Buy row appear in that order inside one
  visible frame

#### Scenario: The collection number is padded

- **WHEN** the first Forgotten Crossroads card's tile is rendered
- **THEN** its frame reads `FC 001`

#### Scenario: The frame leaves the card alone

- **WHEN** a framed card is rendered
- **THEN** no part of the collection number or of either row overlaps the card
- **AND** the card's structure, proportions, and internal layout are those the renderer gives it at
  that width

#### Scenario: Tiles share one size

- **WHEN** tiles for an unowned card, a card held twelve times, and a card with a warned pending sale
  are rendered
- **THEN** all three frames have the same width and height

### Requirement: A tile's Sell row sets how many copies are pending for sale

Every tile SHALL present a row labelled `Sell` holding a minus control, the quantity of the card
pending for sale, a plus control, and, to their right, a control whose face is a down arrow and the
numeral 9. The plus control SHALL raise the quantity by one and SHALL be unavailable when every copy
held is pending. The minus control SHALL lower it by one and SHALL be unavailable at zero. The `↓9`
control SHALL set the quantity so that exactly nine copies would remain, and SHALL be unavailable
where the player holds nine copies or fewer. Each control's accessible name SHALL state what it does
and the card, such as `Sell down to 9 Crawlid`. The sale price per copy SHALL be available as the
row's tooltip and to assistive technology. An unavailable plus or `↓9` control SHALL give its reason
as its tooltip and to assistive technology. The row SHALL be presented for a card the player does not
hold, with every control unavailable.

#### Scenario: Stepping the quantity

- **WHEN** a player holding three copies of a card activates its sell plus control twice and its sell
  minus control once
- **THEN** its Sell row reads 1

#### Scenario: Selling is bounded by what is held

- **WHEN** a player holding two copies of a card has 2 pending for sale
- **THEN** its sell plus control is unavailable

#### Scenario: Selling down to nine

- **WHEN** a player holding 14 copies of a card activates `↓9`
- **THEN** its Sell row reads 5

#### Scenario: Selling down replaces the quantity

- **WHEN** a player holding 14 copies of a card has 8 pending for sale and activates `↓9`
- **THEN** its Sell row reads 5

#### Scenario: Selling down is unavailable at nine or fewer

- **WHEN** a player holds nine copies of one card and two of another
- **THEN** both cards' `↓9` controls are unavailable, and activating them changes nothing

#### Scenario: An unowned card cannot be sold

- **WHEN** a card the player holds no copy of is presented
- **THEN** its Sell row reads 0 and each of the row's controls is unavailable

### Requirement: A tile's Buy row sets how many copies are pending for purchase

Every tile SHALL present a row labelled `Buy` holding a minus control, the quantity of the card
pending for purchase, a plus control, and, to their right, a control whose face is an up arrow and
the numeral 9. The plus control SHALL raise the quantity by one and SHALL be unavailable at 99. The
minus control SHALL lower it by one and SHALL be unavailable at zero. The `↑9` control SHALL set the
quantity so that the player would hold exactly nine copies, and SHALL be unavailable where the player
holds nine copies or more. The player's balance SHALL NOT limit any of them: what the player can
afford is decided when the cart is confirmed. Each control's accessible name SHALL state what it does
and the card, such as `Buy up to 9 Crawlid`. The purchase price per copy SHALL be available as the
row's tooltip and to assistive technology. An unavailable plus or `↑9` control SHALL give its reason
as its tooltip and to assistive technology.

#### Scenario: Stepping the quantity

- **WHEN** the player activates a card's buy plus control three times and its buy minus control once
- **THEN** its Buy row reads 2

#### Scenario: Buying up to nine

- **WHEN** a player holding two copies of a card activates `↑9`
- **THEN** its Buy row reads 7

#### Scenario: Buying an unowned card up to nine

- **WHEN** a player holding no copy of a card activates `↑9`
- **THEN** its Buy row reads 9

#### Scenario: Buying up is unavailable at nine or more

- **WHEN** a player holds nine copies of one card and fourteen of another
- **THEN** both cards' `↑9` controls are unavailable, and activating them changes nothing

#### Scenario: Buying is not limited by the balance

- **WHEN** a player holding no Rosaries activates a card's buy plus control
- **THEN** its Buy row reads 1

#### Scenario: The rows exclude each other

- **WHEN** a card has 3 pending for purchase and the player activates its sell plus control
- **THEN** its Sell row reads 1 and its Buy row reads 0

### Requirement: A Sell row warns when its pending sale would trim decks

Where a card's pending sale would take copies of it out of one or more decks, its Sell row SHALL carry
a warning mark that does not rely on colour, with a tooltip and accessible description naming every
deck that would lose copies, such as `Selling removes it from Deck 1 and Deck 3`. Where the pending
sale would trim no deck, or nothing is pending for sale, the row SHALL carry no warning. The mark's
appearance MUST NOT move the row's controls.

#### Scenario: A trimming sale is marked

- **WHEN** a player's only copy of a card used by Deck 1 and Deck 3 is pending for sale
- **THEN** its Sell row carries a warning mark
- **AND** its tooltip and accessible description name Deck 1 and Deck 3

#### Scenario: A sale that trims nothing carries no warning

- **WHEN** a player holding three copies of a card, used twice by one deck, has 1 pending for sale
- **THEN** its Sell row carries no warning, because two copies would remain

#### Scenario: Nothing pending, nothing warned

- **WHEN** a player's only copy of a card is used by a deck and is not pending for sale
- **THEN** its Sell row carries no warning

## REMOVED Requirements

### Requirement: Every card in a set can be bought for Rosaries

**Reason**: Buying is now pending. The one-copy Buy control is replaced by the Buy row, and
affordability is decided when the cart is confirmed.
**Migration**: See `A tile's Buy row sets how many copies are pending for purchase` and the `cart`
capability.

### Requirement: Every card the player holds can be sold for Rosaries

**Reason**: Selling is now pending. The one-copy Sell control is replaced by the Sell row, and its
deck warning follows the pending quantity.
**Migration**: See `A tile's Sell row sets how many copies are pending for sale`, `A Sell row warns
when its pending sale would trim decks`, and the `cart` capability.

### Requirement: The outcome of an exchange is announced

**Reason**: Exchanges happen when the cart is confirmed, not from a tile.
**Migration**: See `Cart changes and outcomes are announced` in the `cart` capability.

### Requirement: Exchanges take effect at once and are never saved by hand

**Reason**: Exchanges are now held in a cart and take effect only on confirmation.
**Migration**: See `Nothing changes until the cart is confirmed` and `Confirming settles the whole
cart at once` in the `cart` capability.
