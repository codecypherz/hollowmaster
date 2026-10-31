## Purpose

Establishes the Cards page as the place where the player will view the cards they own and assemble decks from them, delivering its route and a themed placeholder skeleton now so both experiences can be designed against a real page later.

## Requirements

### Requirement: The Collection page is headed by the single-line screen header

The Collection page SHALL name itself with the design system's single-line screen header, titled
`Collection`, at the top of the page. The page SHALL declare no heading treatment of its own beside
it. At every viewport the page supports, the header SHALL occupy a single line.

#### Scenario: The page is titled on one line

- **WHEN** the Collection page renders at any viewport size it supports
- **THEN** its title `Collection` is presented by the single-line screen header
- **AND** the header occupies a single line

#### Scenario: The page composes the primitive

- **WHEN** the Collection page's header is inspected
- **THEN** it is the shared single-line screen header
- **AND** the page declares no competing title or ornament styling of its own

### Requirement: The Rosary purse sits in the top-right corner of the page

The Collection page SHALL show the player's current Rosary balance in the top-right corner of the
page, rendered through the Rosary amount primitive. The balance SHALL be shown whenever the page is
shown, including when it is zero. It SHALL show the user's actual balance and SHALL update as soon
as that balance changes, without the page being reloaded. The purse MUST NOT overlap the screen
header's title. It SHALL stay in place while the sections scroll, and assistive technology SHALL
announce it as the player's Rosaries.

#### Scenario: The purse is in the top-right corner

- **WHEN** the Collection page renders at any viewport size it supports
- **THEN** the Rosary balance is shown at the top-right of the page
- **AND** it does not overlap the page's title

#### Scenario: A zero balance is shown as zero

- **WHEN** a new player views the Collection page
- **THEN** the purse shows zero followed by the Rosary mark rather than being hidden or left blank

#### Scenario: The purse follows an exchange

- **WHEN** the player sells a card and then buys one
- **THEN** the purse rises by the sale price and then falls by the purchase price
- **AND** neither change needs the page to be reloaded

#### Scenario: The purse stays put while the sections scroll

- **WHEN** the player scrolls the sections
- **THEN** the purse remains visible in place

### Requirement: The Collection page presents one section per card set

The Collection page SHALL present one section for each named card set, in the order the sets are
stated. Each section SHALL be headed by the set's display name, such as `Forgotten Crossroads`. The
heading SHALL state how much of the set the player has collected, as the number of the set's
distinct cards held at least once and the number of cards the set holds, such as `9 / 15`. Its
accessible name SHALL put that in words, such as `9 of 15 collected`. A named set the catalogue
holds no cards for SHALL still be presented as a section headed by its name and marked as
forthcoming. It SHALL present no tiles, prices, or controls.

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

- **WHEN** the player buys a card of a set they did not hold any copy of
- **THEN** that set's progress rises by one without the page being reloaded
- **AND** when they sell their last copy of it, the progress falls by one

#### Scenario: A set with no cards yet is forthcoming

- **WHEN** a named set holds no catalogued cards
- **THEN** its section is presented, headed by its name and marked as forthcoming
- **AND** it presents no tile, price, or exchange control

### Requirement: A set's section shows every card in the set, owned or not

Each section SHALL present one tile for every card the catalogue holds in that set, ordered by the
card's number within the set, lowest first. A card the player does not hold SHALL still be
presented. The page MUST NOT reorder tiles in response to an exchange. The sections SHALL be the
page's scrolling content.

#### Scenario: Unowned cards are present

- **WHEN** the catalogue holds cards of a set the player does not own
- **THEN** a tile is presented for each of them in that set's section

#### Scenario: Tiles read in set-number order

- **WHEN** a section is rendered
- **THEN** its tiles read in ascending order of their number within the set

#### Scenario: An exchange does not reorder the page

- **WHEN** the player buys or sells a card
- **THEN** every tile on the page keeps its position

### Requirement: A tile distinguishes owned cards from unowned ones

A tile for a card the player holds SHALL show, as a badge over the bottom of the tile, how many
copies are held, including a single copy. Its accessible name SHALL state the count in words, such
as `3 held`. A tile for a card the player does not hold SHALL be marked as not owned, both by a
visual treatment that recedes the card and by a cue that survives colour removal, such as a `Not
owned` label in place of the count. Its accessible name SHALL state that the card is not owned. The
marks SHALL follow the collection without the page being reloaded. They MUST NOT obscure the card's
name, its star track, either stat bar, or any of its eight chevrons.

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

- **WHEN** the player buys a card they did not hold
- **THEN** its tile stops being marked as not owned and states one held

#### Scenario: Selling the last copy marks it unowned

- **WHEN** the player sells their only copy of a card
- **THEN** its tile is marked as not owned

#### Scenario: The marks obscure nothing

- **WHEN** a tile's count badge or not-owned mark is rendered
- **THEN** the card's name, all five star slots, both stat bars with their labels, and all eight
  chevrons remain visible and legible

### Requirement: A Collection tile renders the card without its ability text

A tile SHALL render its card through the shared card renderer. The card SHALL be laid out at no
less than the renderer's minimum supported width and narrower than the width at which the renderer
shows the ability section, so the ability section is withheld by the renderer's own width gate. No
tile SHALL reimplement the card face. The tile's overlays, its marks and its exchange controls,
belong to the page and MUST NOT alter what the renderer draws. Every card the page renders SHALL
follow the established card design contract: the 2.5:3.5 aspect ratio, the four sections, chevron
placement, rarity stars, and numeral-free stat bars.

#### Scenario: A tile shows no ability text

- **WHEN** a tile is rendered
- **THEN** the card's name, artwork, star track, chevrons, and both stat bars are present
- **AND** the ability section is not visible

#### Scenario: Tiles honour the renderer's minimum width

- **WHEN** the Collection page is rendered at any viewport the page supports
- **THEN** every tile's card is laid out at or above the renderer's minimum supported width
- **AND** holds the 2.5 : 3.5 ratio

#### Scenario: The not-owned treatment leaves the card alone

- **WHEN** an unowned card's tile is rendered
- **THEN** the card beneath the page's treatment is unchanged in structure, proportions, and
  internal layout

### Requirement: Every card in a set can be bought for Rosaries

Every tile SHALL offer a control that buys one copy of its card. That includes a card the player
already holds, at any quantity. The control SHALL be labelled `Buy` followed by the card's purchase
price as a Rosary amount, and its accessible name SHALL name the card and the price, such as
`Buy Crawlid for 100 Rosaries`. Buying SHALL spend exactly that price and add one copy to the
collection as one settled outcome. Where the player's Rosary balance is below the price, the
control SHALL remain in place, showing its price, but be presented as unavailable. Activating it
SHALL do nothing, and the reason, not enough Rosaries, SHALL be available as the control's tooltip
and to assistive technology. The control SHALL remain focusable so that reason can be read. A
control that becomes affordable SHALL become available without the page being reloaded.

#### Scenario: Buying a card the player does not hold

- **WHEN** a player holding 150 Rosaries buys a one-star card they do not hold
- **THEN** their balance is 50
- **AND** the card's tile states one held

#### Scenario: Buying more of a card already held

- **WHEN** a player holding two copies of a card buys it again
- **THEN** its tile states three held
- **AND** the balance falls by its purchase price

#### Scenario: The price is shown on the control

- **WHEN** a three-star card's tile is presented
- **THEN** its buy control reads `Buy` followed by 300 and the Rosary mark

#### Scenario: An unaffordable card cannot be bought

- **WHEN** a player holding 99 Rosaries activates the buy control of a one-star card
- **THEN** nothing is bought and the balance is still 99
- **AND** the control is presented as unavailable, still showing its price
- **AND** its tooltip and accessible description state that there are not enough Rosaries

#### Scenario: A card becomes buyable when the balance reaches its price

- **WHEN** the player's balance rises to a card's purchase price
- **THEN** that card's buy control becomes available without the page being reloaded

### Requirement: Every card the player holds can be sold for Rosaries

Every tile for a card the player holds SHALL offer a control that sells one copy of it, labelled
`Sell` followed by the card's sale price as a Rosary amount. Its accessible name SHALL name the
card and the price, such as `Sell Crawlid for 10 Rosaries`. Selling SHALL remove one copy from the
collection, credit exactly the sale price, and trim any deck the sale leaves over the quantity held,
as one settled outcome. A tile for a card the player does not hold SHALL NOT offer the sell
control. Its absence MUST NOT shift the tile's other controls or its neighbours.

Where selling a copy would trim one or more decks, the sell control SHALL say so before it is
activated. It SHALL carry a warning mark that does not rely on colour, and its tooltip and
accessible description SHALL name every deck the sale would take the card out of, such as
`Selling removes it from Deck 1 and Deck 3`. The sale SHALL then proceed on a single activation,
with no confirmation step. Where the sale would trim no deck, the control SHALL carry no warning.

#### Scenario: Selling a duplicate

- **WHEN** a player holding three copies of a two-star card, with no deck using it, sells one
- **THEN** its tile states two held
- **AND** the Rosary balance rises by 20

#### Scenario: Selling the last copy

- **WHEN** a player sells their only copy of a card
- **THEN** its tile is marked as not owned
- **AND** it no longer offers the sell control, while its buy control stays where it was

#### Scenario: A sale that would trim decks warns first

- **WHEN** a player holding one copy of a card used by Deck 1 and Deck 3 views that card's tile
- **THEN** its sell control carries a warning mark
- **AND** its tooltip and accessible description name Deck 1 and Deck 3

#### Scenario: The warned sale trims the named decks

- **WHEN** that player sells the card
- **THEN** neither Deck 1 nor Deck 3 holds it any longer
- **AND** no other deck is changed

#### Scenario: A sale that trims nothing carries no warning

- **WHEN** a player holding three copies of a card, used twice by one deck, views its tile
- **THEN** its sell control carries no warning, because two copies would remain

#### Scenario: Unowned cards offer no sale

- **WHEN** a card the player holds no copy of is presented
- **THEN** its tile offers no sell control

### Requirement: The outcome of an exchange is announced

After each purchase or sale, the page SHALL announce the outcome to assistive technology without
moving focus. The announcement SHALL name the card, what happened, and the amount, and, for a sale
that trimmed decks, the decks it was removed from. Focus SHALL stay on the control that was
activated. If the sale left that control absent, focus SHALL move to the same tile's buy control.

#### Scenario: A purchase is announced

- **WHEN** the player buys a Crawlid
- **THEN** assistive technology announces that a Crawlid was bought for 100 Rosaries
- **AND** focus remains on the buy control

#### Scenario: A trimming sale is announced with its decks

- **WHEN** the player sells their last Crawlid, which Deck 2 used
- **THEN** assistive technology announces the sale, its price, and that it was removed from Deck 2
- **AND** focus moves to that tile's buy control

### Requirement: Exchanges take effect at once and are never saved by hand

Every purchase and sale SHALL take effect immediately and SHALL be durable. It SHALL be visible
without the page being reloaded wherever the user is read, including the Decks page's collection
and decks. The page SHALL present no save control, no unsaved state, and no confirmation of
persistence.

#### Scenario: An exchange survives a reload

- **WHEN** the player buys and sells cards and then reloads the application
- **THEN** the Rosary balance, the collection, and the decks reflect those exchanges

#### Scenario: No save step exists

- **WHEN** the player views the Collection page
- **THEN** no control that saves, applies, or commits an exchange is presented

### Requirement: The Collection page fits the viewport

The Collection page SHALL fit within the viewport without clipping its content and SHALL make use
of the space available to it. The page itself SHALL NOT scroll in either axis. The sections SHALL be
the only region that scrolls, and the header and the purse SHALL keep their place. Tiles SHALL be
laid out from the left edge of the scrolling region. A row with fewer tiles than the region holds
SHALL leave its unused space on the right. Every section's heading SHALL begin at the same left
edge as its first tile.

#### Scenario: The page itself does not scroll

- **WHEN** the Collection page is rendered at any viewport size it supports
- **THEN** the document scrolls neither horizontally nor vertically
- **AND** its content is fully visible without being clipped

#### Scenario: Only the sections scroll

- **WHEN** the sections hold more tiles than their region can show
- **THEN** that region scrolls
- **AND** the header and the purse stay where they are

#### Scenario: A short row sits against the left edge

- **WHEN** a section holds fewer tiles than one row can fit
- **THEN** its heading and its first tile begin at the region's left edge
- **AND** the unused width of the row lies to the right of its last tile

### Requirement: The Collection page draws no corner frame

The Collection page SHALL NOT draw the design system's corner-frame brackets at its edges or
anywhere else on the page. The page's atmosphere (the void background, the mist, and the soul
particles) SHALL remain.

#### Scenario: No corner brackets are drawn

- **WHEN** the Collection page renders at any supported viewport
- **THEN** no corner-frame bracket is present at any corner of the page

#### Scenario: The atmosphere remains

- **WHEN** the Collection page renders
- **THEN** its void background, mist, and soul particles are still drawn

### Requirement: Every action on the Collection page is operable by keyboard

Every buy and sell control SHALL be reachable and operable by keyboard, with a visible focus
indicator. That includes an unavailable buy control, which SHALL remain focusable so its reason
can be read. The order in which controls receive focus SHALL follow the reading order of the
sections and their tiles.

#### Scenario: Buying and selling without a pointer

- **WHEN** the player tabs to a tile's buy control and activates it, then to its sell control and
  activates that
- **THEN** a copy is bought and then a copy is sold
- **AND** each control showed a visible focus indicator when focused

#### Scenario: The unavailable control can be focused

- **WHEN** the player cannot afford a card and tabs to its buy control
- **THEN** the control receives focus and its reason is available

### Requirement: The Collection page honours a reduced-motion preference

Where the player's environment asks for reduced motion, the page's entrances and transitions,
including the tiles' arrival and any feedback on a count or the purse changing, SHALL be reduced to
an immediate state change. Every state the motion would have carried SHALL remain distinguishable
without it.

#### Scenario: Motion is removed, not the information

- **WHEN** the Collection page is used with a reduced-motion preference expressed
- **THEN** tiles and the purse appear without animation
- **AND** owned and unowned tiles, counts, and the unavailable and warning treatments are all still
  distinguishable
