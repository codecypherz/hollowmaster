## Purpose

Defines the Collection page: the catalogue of every card, set by set, showing which the player owns
and how many, the Rosary purse, and the controls on each card through which the player exchanges
cards for Rosaries.

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
shown, including when it is zero. It SHALL show the user's actual balance, unaffected by anything
pending in the cart, and SHALL update as soon as that balance changes, without the page being
reloaded. The purse MUST NOT overlap the screen header's title. It SHALL stay in place while the
sections scroll, and assistive technology SHALL announce it as the player's Rosaries, with the
balance.

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

#### Scenario: The purse announces its balance

- **WHEN** assistive technology reads the purse of a player holding 450 Rosaries
- **THEN** it is announced as the player's Rosaries, with a balance of 450

### Requirement: The purse opens the exchange rates

The purse SHALL be a button, with a down chevron to the left of the balance marking that it opens
more information. Activating it SHALL open a dropdown beneath it listing the Rosary rates, and
activating it again SHALL close it. The dropdown SHALL list one line per rarity the player knows the
rate of, lowest first, each giving the rarity, what selling one copy credits, and what buying one
copy costs. The rarity SHALL be shown as stars, with its number given in words to assistive
technology, and both amounts SHALL be shown through the Rosary amount primitive under headings
naming them as sell and buy. Where the player does not know the rarity 6 rate, its line SHALL be
left out entirely, with no gap, placeholder, or hint in its place, for assistive technology too. The
lines SHALL follow the user without the page being reloaded.

The dropdown is for information only and SHALL offer no other action. The button SHALL expose to
assistive technology that it controls the dropdown and whether it is open. The dropdown SHALL be
dismissed by Escape, which SHALL leave focus on the button, by activating anything outside it, and
by focus moving elsewhere. Opening it MUST NOT move, resize, or scroll anything else on the page,
and it SHALL fit within every viewport the page supports.

#### Scenario: The purse is marked as a dropdown

- **WHEN** the Collection page renders
- **THEN** a down chevron is drawn to the left of the Rosary balance inside the purse button
- **AND** assistive technology announces the player's Rosaries and that the button is collapsed

#### Scenario: The rates are listed

- **WHEN** a player who knows every rate opens the dropdown
- **THEN** six lines are listed, from one star to six
- **AND** they read 1 and 4, 3 and 12, 9 and 27, 33 and 99, 330 and 660, and 5000 and 9999, sell
  then buy

#### Scenario: The rarity 6 line is left out

- **WHEN** a new player opens the dropdown
- **THEN** five lines are listed, from one star to five
- **AND** nothing in the dropdown mentions a sixth rarity

#### Scenario: The rarity 6 line appears once earned

- **WHEN** a player's balance reaches 9999 for the first time
- **THEN** the dropdown lists the rarity 6 line the next time it is seen, without a reload

#### Scenario: Dismissing by keyboard

- **WHEN** the dropdown is open and the player presses Escape
- **THEN** it closes and focus is on the purse button

#### Scenario: Dismissing by the surrounding area

- **WHEN** the dropdown is open and the player activates anything outside it
- **THEN** it closes

#### Scenario: Opening moves nothing

- **WHEN** the dropdown is opened at any viewport size the page supports
- **THEN** the cart control, the title, the purse, and every tile keep their positions
- **AND** the document does not scroll and the dropdown is not clipped

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

### Requirement: Selecting a card on the Collection page reads it

Selecting a card on the Collection page, owned or not, SHALL open the same reading presentation the
Decks page uses. It SHALL show the card at a size at which its ability text, set, and number are
legible, and SHALL offer no deck action and no exchange action here, only its dismissal. A card that
is not owned SHALL be read without the treatment that recedes its tile. Reading a card MUST NOT
change the collection, the cart, or either balance. On dismissal, focus SHALL return to the card it
was opened from, and the sections SHALL be where they were scrolled to.

#### Scenario: Reading an owned card

- **WHEN** the player selects the card of an owned tile
- **THEN** the reading presentation opens showing that card with its ability text, set, and number
- **AND** it offers only its dismissal

#### Scenario: Reading a card that is not owned

- **WHEN** the player selects the card of a tile marked as not owned
- **THEN** the reading presentation opens showing that card in full, not receded

#### Scenario: The exchange controls do not read

- **WHEN** the player activates any control in a tile's Sell or Buy row
- **THEN** no reading presentation opens

#### Scenario: Dismissal returns to the card

- **WHEN** the reading presentation is opened by keyboard and dismissed with Escape
- **THEN** focus is on the card it was opened from
- **AND** what is pending in the cart is unchanged

### Requirement: Each card is framed beneath its collection number

Every tile SHALL draw a visible frame around its card. Inside the frame, from top to bottom, SHALL
be the card's collection number, the card, its held or not-owned badge, the Sell row, and the Buy
row. The collection number SHALL be the card's set code, a space, and its number within the set
after a pound sign without padding, such as `FC #1`, at the frame's top left. The collection number
and the rows belong to the frame and MUST NOT be drawn inside or over the card. The card within the
frame SHALL be drawn exactly as the shared card renderer draws it, at a width that satisfies the
requirement that a tile render its card without its ability text. Every tile SHALL have the same
size, whatever is held or pending.

#### Scenario: The frame's contents read in order

- **WHEN** a tile is rendered
- **THEN** its collection number, card, badge, Sell row, and Buy row appear in that order inside one
  visible frame

#### Scenario: The collection number is not padded

- **WHEN** the first and the tenth Forgotten Crossroads cards' tiles are rendered
- **THEN** their frames read `FC #1` and `FC #10`

#### Scenario: The frame leaves the card alone

- **WHEN** a framed card is rendered
- **THEN** no part of the collection number or of either row overlaps the card
- **AND** the card's structure, proportions, and internal layout are those the renderer gives it at
  that width

#### Scenario: Tiles share one size

- **WHEN** tiles for an unowned card, a card held twelve times, and a card with a warned pending
  sale are rendered
- **THEN** all three frames have the same width and height

### Requirement: A tile's Sell row sets how many copies are pending for sale

Every tile SHALL present a row labelled `Sell` holding a minus control, a field showing the quantity
of the card pending for sale, a plus control, and, to their right, a control whose face is a down
arrow and the numeral 9. The plus control SHALL raise the quantity by one and SHALL be unavailable
when every copy held is pending. The minus control SHALL lower it by one and SHALL be unavailable at
zero. The `↓9` control SHALL set the quantity so that exactly nine copies would remain, and SHALL be
unavailable where the player holds nine copies or fewer. Each control's accessible name SHALL state
what it does and the card, such as `Sell down to 9 Crawlid`. The sale price per copy SHALL be shown
on the row and available to assistive technology. An unavailable plus or `↓9` control SHALL give its
reason as its tooltip and to assistive technology. The row SHALL be presented for a card the player
does not hold, with every control unavailable.

#### Scenario: Stepping the quantity

- **WHEN** a player holding three copies of a card activates its sell plus control twice and its
  sell minus control once
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

Every tile SHALL present a row labelled `Buy` holding a minus control, a field showing the quantity
of the card pending for purchase, a plus control, and, to their right, a control whose face is an up
arrow and the numeral 9. The plus control SHALL raise the quantity by one and SHALL be unavailable
at 99. The minus control SHALL lower it by one and SHALL be unavailable at zero. The `↑9` control
SHALL set the quantity so that the player would hold exactly nine copies, and SHALL be unavailable
where the player holds nine copies or more. The player's balance SHALL NOT limit any of them: what
the player can afford is decided when the cart is confirmed. Each control's accessible name SHALL
state what it does and the card, such as `Buy up to 9 Crawlid`. The purchase price per copy SHALL be
shown on the row and available to assistive technology. An unavailable plus or `↑9` control SHALL
give its reason as its tooltip and to assistive technology. Where the player does not know the rate
of the card's rarity, every control in the row SHALL be unavailable, and the reason SHALL be that
its price is not yet known.

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

#### Scenario: A card whose rate is not known cannot be bought

- **WHEN** a six-star card's tile is presented to a player who does not know the rarity 6 rate
- **THEN** its Buy row reads 0, each of its controls is unavailable, and activating them changes
  nothing
- **AND** the plus and `↑9` controls state that its price is not yet known

#### Scenario: Earning the rate offers the purchase

- **WHEN** that player comes to know the rarity 6 rate
- **THEN** the card's Buy row shows its price and its plus control is available without a reload

### Requirement: The Sell and Buy rows are segmented bars showing their price

Each row SHALL draw its minus control, quantity field, plus control, and nine-copies control as one
joined bar through the design system's segmented control, sharing edges rather than standing apart.
The Sell row's bar SHALL be gold accented and the Buy row's soul accented. The two rows SHALL also
be told apart by their visible labels, `Sell` and `Buy`, so that neither relies on colour. Under
each label the row SHALL show its price per copy through the Rosary amount primitive. The two bars
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

### Requirement: A pending quantity can be typed

The quantity in a Sell row and in a Buy row SHALL be an editable field. It SHALL accept digits only.
A typed quantity SHALL take effect when the player presses Enter or leaves the field, and SHALL then
behave exactly as though the row's plus and minus controls had brought it there: the cart, the other
row, and the deck warning SHALL follow, and the change SHALL be announced. A quantity above the
row's bound SHALL become the bound, and zero SHALL take the line out of the cart. A field left empty
SHALL return to the quantity it held before editing. Pressing Escape while editing SHALL do the
same. While a quantity is being typed, nothing pending SHALL change. Where the row's plus control is
unavailable at a quantity of zero, the field SHALL NOT be editable but SHALL remain focusable, with
the same reason the plus control gives. The field's accessible name SHALL state the direction and
the card, such as `Copies of Crawlid to sell`.

#### Scenario: Typing a purchase

- **WHEN** the player types 25 into a card's Buy field and presses Enter
- **THEN** its Buy row reads 25 and 25 copies are pending for purchase
- **AND** the change is announced

#### Scenario: Leaving the field commits it

- **WHEN** the player types 4 into a card's Buy field and tabs away
- **THEN** 4 copies are pending for purchase

#### Scenario: A quantity beyond the bound becomes the bound

- **WHEN** a player holding three copies of a card types 50 into its Sell field and presses Enter
- **THEN** its Sell row reads 3
- **AND** when they type 50 again and press Enter, it still reads 3

#### Scenario: Typing excludes the other row

- **WHEN** a card has 3 pending for purchase and the player types 1 into its Sell field and presses
  Enter
- **THEN** its Sell row reads 1 and its Buy row reads 0

#### Scenario: An empty field restores the quantity

- **WHEN** the player clears a Buy field that held 3 and leaves it
- **THEN** it reads 3 and 3 copies are still pending

#### Scenario: Escape abandons the edit

- **WHEN** the player types 8 into a Buy field that held 3 and presses Escape
- **THEN** it reads 3 and 3 copies are still pending

#### Scenario: Nothing changes while typing

- **WHEN** the player has typed 12 into a Buy field that held 0 and has not pressed Enter or left it
- **THEN** the cart's count is unchanged

#### Scenario: The plus control carries on from what was typed

- **WHEN** the player types 5 into a Buy field and then activates its plus control
- **THEN** its Buy row reads 6

#### Scenario: An unowned card's Sell field

- **WHEN** a card the player holds no copy of is presented
- **THEN** its Sell field reads 0, cannot be edited, and can be focused to read its reason

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

The cart control, the purse, every tile's card, and every control and field in a tile's Sell and Buy
rows SHALL be reachable and operable by keyboard, with a visible focus indicator. That includes an
unavailable control, which SHALL remain focusable, so that focus is not lost when an activation
makes the activated control unavailable, and so that its reason can be read where it has one. The
order in which controls receive focus SHALL follow the page's reading order: the cart control, the
purse, then the sections and their tiles, and within a tile the card, the Sell row, and then the Buy
row.

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

#### Scenario: Reading and checking rates without a pointer

- **WHEN** the player, using only the keyboard, opens the exchange rates and then reads a card
- **THEN** each opens and is dismissed, and focus returns to what opened it

### Requirement: The Collection page honours a reduced-motion preference

Where the player's environment asks for reduced motion, the page's entrances and transitions,
including the tiles' arrival and any feedback on a count, a pending quantity, the cart control, or
the purse changing, and the exchange rates or the reading presentation opening, SHALL be reduced to
an immediate state change. Every state the motion would have
carried SHALL remain distinguishable without it.

#### Scenario: Motion is removed, not the information

- **WHEN** the Collection page is used with a reduced-motion preference expressed
- **THEN** tiles, the cart control, the purse, the exchange rates, and the reading presentation
  appear without animation
- **AND** owned and unowned tiles, counts, pending quantities, and the unavailable and warning
  treatments are all still distinguishable
