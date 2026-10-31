## Purpose

Defines the Decks page (formerly the Cards page): where the player builds decks from the cards they
own. It shows the selected deck's nine positions and its standing, a collection of owned cards to
draw from, and the controls that create, delete, and fill decks.

## ADDED Requirements

### Requirement: The Decks page fits the viewport

The Decks page SHALL fit within the viewport without clipping its content and SHALL make use of the
space available to it. The page itself SHALL NOT scroll in either axis: the collection is the only
region that scrolls, and the pinned deck region keeps its place. Where the viewport is too small to
lay the deck's nine positions out at the card renderer's minimum supported width, the pinned region
SHALL be uniformly scaled as a whole rather than laying any card out below that minimum.

#### Scenario: Rendering at a range of viewport sizes

- **WHEN** the Decks page renders
- **THEN** its content is fully visible without being clipped

#### Scenario: The page itself does not scroll

- **WHEN** the Decks page is rendered at any viewport size it supports
- **THEN** the document scrolls neither horizontally nor vertically

#### Scenario: Only the collection scrolls

- **WHEN** the collection holds more cards than its region can show
- **THEN** that region scrolls
- **AND** the pinned deck region, its deck buttons, and the page's controls stay where they are

#### Scenario: A viewport too narrow for the deck scales it

- **WHEN** the viewport cannot host nine deck positions at the card renderer's minimum supported width
- **THEN** the pinned region is uniformly scaled down as a whole
- **AND** no card is laid out below the renderer's minimum supported width

### Requirement: The Decks page presents the player's real collection and decks

The Decks page SHALL present the player's actual holdings: the cards their collection holds and the
decks they have built. What it shows MUST be read from the one user the application maintains, so
that a card granted elsewhere — by a pack, by the starter seed — appears here without the page
being reloaded, and a deck edited here is the deck every other reader of the user sees.

#### Scenario: The page shows what the player owns

- **WHEN** the player navigates to the Decks page
- **THEN** the cards shown are the cards their collection holds
- **AND** no card the collection does not hold is presented as owned

#### Scenario: A card won elsewhere is here on arrival

- **WHEN** the player opens a pack in the Shop and then navigates to the Decks page
- **THEN** the cards that pack granted are present in the collection
- **AND** the count shown for a card they already held has risen

#### Scenario: A card exchanged on the Collection page is reflected on arrival

- **WHEN** the player buys one card and sells their last copy of another on the Collection page,
  and then navigates to the Decks page
- **THEN** the bought card is present in the collection
- **AND** the sold card is absent from the collection and from every deck

#### Scenario: The page presents nothing as forthcoming that it can show

- **WHEN** the player views the Decks page
- **THEN** the collection and the deck being built are presented as real, usable player data
- **AND** neither is marked as a placeholder or as coming later

### Requirement: The selected deck is pinned above the collection

The selected deck SHALL occupy a region pinned to the top of the page, above the collection, and
that region SHALL remain visible while the collection is scrolled. The deck buttons, the deck's
positions, the control that creates a deck, the control that deletes the deck on screen, the
control that orders the collection and sets its direction, and the reset control SHALL all sit in
that pinned region, so that none of them can be scrolled out of reach.

#### Scenario: The deck stays put while the collection moves

- **WHEN** the player scrolls the collection
- **THEN** the selected deck, its deck buttons, and the page's controls remain visible in place
- **AND** only the collection moves

#### Scenario: The deck is above the collection

- **WHEN** the Decks page is rendered
- **THEN** the pinned deck region is presented above the collection, not beside or below it

### Requirement: The selected deck shows all nine of its positions

The pinned region SHALL present nine positions for the selected deck. A position holding a card
SHALL render that card through the shared card renderer. A free position SHALL render as a visibly
empty position rather than as nothing at all, so the deck's remaining capacity is legible without
counting. The region SHALL NOT state how many of the nine positions are filled. What the deck still
needs is stated by its standing.

#### Scenario: A part-filled deck shows its capacity

- **WHEN** a deck holding four cards is shown
- **THEN** four positions render those four cards in the deck's order
- **AND** five positions render as empty

#### Scenario: An empty deck is nine empty positions

- **WHEN** a deck holding no cards is shown
- **THEN** nine empty positions are rendered
- **AND** the page states that the deck needs cards that can be added from the collection below

#### Scenario: A full deck reads as full

- **WHEN** a deck holding nine cards is shown
- **THEN** all nine positions render cards
- **AND** no position renders as empty

### Requirement: Deleting a deck is confirmed before it happens

The Decks page SHALL offer a control that deletes the deck on screen, and that deletion SHALL be
confirmed by the player before it takes effect. The confirmation SHALL name the deck being deleted.
Declining SHALL leave the deck and its contents exactly as they were. Deleting SHALL remove the
deck without changing the collection, and the page SHALL then show another of the player's decks,
or the no-decks state if none remains.

#### Scenario: Deletion asks first

- **WHEN** the player activates the control that deletes the deck on screen
- **THEN** a confirmation naming that deck is presented
- **AND** the deck is not yet deleted

#### Scenario: Declining changes nothing

- **WHEN** the player declines the confirmation
- **THEN** the deck is still present with the same cards in the same positions
- **AND** it is still the deck on screen

#### Scenario: Confirming deletes the deck and keeps the cards

- **WHEN** the player confirms the deletion of a deck holding nine cards
- **THEN** that deck and its tab are gone
- **AND** every card it held is still in the collection at the same count
- **AND** the remaining decks are renumbered, so their tabs read `Deck 1` upward with no gap

#### Scenario: Deleting the deck on screen selects another

- **WHEN** the player confirms deleting one of several decks
- **THEN** another of their decks becomes the deck on screen

#### Scenario: Deleting the last deck leaves the no-decks state

- **WHEN** the player confirms deleting their only deck
- **THEN** no deck is shown and the page offers the control that creates one
- **AND** the collection below is unchanged

### Requirement: The collection lists every card the player owns

Below the pinned region the page SHALL present one tile for each distinct card the collection
holds, and SHALL NOT present a tile for a card held at a quantity of zero. The collection SHALL be
the page's scrolling content.

#### Scenario: One tile per distinct card

- **WHEN** a player holding three copies of one card and one copy of another views the collection
- **THEN** two tiles are presented

#### Scenario: Unowned cards are absent

- **WHEN** the catalogue holds cards the player does not own
- **THEN** no tile, slot, or gap is presented for them

#### Scenario: The collection is what scrolls

- **WHEN** the collection holds more cards than fit the space below the pinned region
- **THEN** the collection scrolls within that space

### Requirement: A collection tile renders the card without its ability text

A collection tile SHALL render its card through the shared card renderer, laid out at no less than
the renderer's minimum supported width and narrower than the width at which the renderer shows the
ability section, so that the smaller face the collection wants is the renderer's own width-gated
behaviour rather than a second way of drawing a card. No tile SHALL reimplement the card face.

#### Scenario: A collection tile shows no ability text

- **WHEN** a collection tile is rendered
- **THEN** the card's name, artwork, star track, chevrons, and both stat bars are present
- **AND** the ability section is not visible

#### Scenario: Tiles honour the renderer's minimum width

- **WHEN** the collection is rendered at any viewport the page supports
- **THEN** every tile's card is laid out at or above the renderer's minimum supported width

#### Scenario: The card face is not reimplemented

- **WHEN** a collection tile presents a card
- **THEN** it delegates to the shared card renderer
- **AND** it declares no copy of the card face structure of its own

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

### Requirement: The collection can be ordered five ways, in a direction the player can reverse

The page SHALL let the player order the collection by rarity, by quantity held, by name, by attack,
or by defense, in either direction. Each order SHALL carry a default direction: rarity, quantity,
attack, and defense default to highest first; name defaults to A to Z. The control SHALL name the
five orders, SHALL show which is in effect, and SHALL show the direction in effect with a chevron
on the active order: pointing down for descending and up for ascending. Choosing the order already
in effect SHALL reverse its direction. Choosing a different order SHALL apply that order in its
default direction. The direction SHALL be exposed to assistive technology in words. Choosing an
order or a direction SHALL reorder the collection without the page being reloaded and without
changing the deck on screen.

#### Scenario: The five orders are offered and the active one is shown

- **WHEN** the player views the collection's ordering control
- **THEN** rarity, quantity, name, attack, and defense are each offered by name
- **AND** the one currently in effect is marked
- **AND** only the active order shows a direction chevron

#### Scenario: The chevron shows the direction

- **WHEN** the collection is ordered by rarity, highest first
- **THEN** the rarity option shows a chevron pointing down
- **AND** assistive technology announces the order as descending

#### Scenario: Choosing the active order reverses it

- **WHEN** the collection is ordered by attack, highest first, and the player chooses attack again
- **THEN** the collection is ordered by attack, lowest first
- **AND** the chevron points up

#### Scenario: A new order starts in its default direction

- **WHEN** the collection is ordered by attack, lowest first, and the player chooses name
- **THEN** the collection is ordered by name, A to Z

#### Scenario: Ordering by rarity puts the rarest first

- **WHEN** the collection is ordered by rarity in its default direction
- **THEN** cards of a higher star rating precede cards of a lower one

#### Scenario: Ordering by quantity puts the most-held first

- **WHEN** the collection is ordered by quantity in its default direction
- **THEN** a card held three times precedes a card held once

#### Scenario: Ordering by name runs A to Z

- **WHEN** the collection is ordered by name
- **THEN** the cards read in ascending alphabetical order of their names
- **AND** when name is chosen again, they read in descending alphabetical order

#### Scenario: Ordering by a stat puts the highest first

- **WHEN** the collection is ordered by attack, and again by defense, in the default direction
- **THEN** in each case the card with the higher value in that stat precedes the card with the lower

#### Scenario: Reordering leaves the deck alone

- **WHEN** the player changes the collection's order or direction
- **THEN** the selected deck, its contents, and its positions are unchanged

### Requirement: The collection opens ordered by rarity, rarest first

On arrival at the Decks page the collection SHALL be ordered by rarity with the rarest cards first.
The player MUST NOT have to choose an order to see a sensibly ordered collection.

#### Scenario: The default order on arrival

- **WHEN** the player navigates to the Decks page
- **THEN** the collection is already ordered by rarity, rarest first
- **AND** the ordering control shows rarity as the order in effect

### Requirement: Every order is total, so equal cards do not shuffle

Each of the five orders, in either direction, SHALL be a total order over the collection: cards that
tie on the chosen value SHALL be placed by a stated, deterministic tie-break rather than left in an
arbitrary order. The tie-break SHALL NOT reverse with the direction: reversing an order reverses
the primary value only. The same collection ordered the same way in the same direction SHALL
produce the same sequence every time.

#### Scenario: Ties are broken deterministically

- **WHEN** the collection is ordered by a value on which several cards tie
- **THEN** those cards appear in the same relative order every time that order is applied

#### Scenario: Reversing keeps ties in place

- **WHEN** the player reverses an order on which several cards tie
- **THEN** the tied cards keep the same relative order among themselves

#### Scenario: Leaving an order and returning to it restores the sequence

- **WHEN** the player chooses another order and then chooses the first one again
- **THEN** the collection reads in exactly the sequence the first order gives in its default
  direction

#### Scenario: Re-rendering does not reshuffle

- **WHEN** the collection is re-rendered for any reason other than a change of order, direction,
  or holdings
- **THEN** its sequence is unchanged

### Requirement: Selecting a card raises an action menu over that card

Selecting a card on the Decks page SHALL raise a small menu over that card offering exactly the
actions available for it: in the collection, adding the card to the selected deck and reading it;
in the deck, removing that card from the deck and reading it. At most one menu SHALL be open at a
time. The menu SHALL be dismissible without taking either action, and raising it MUST NOT reorder,
resize, or reflow the collection or the deck around it.

#### Scenario: A collection card offers adding and reading

- **WHEN** the player selects a card in the collection
- **THEN** a menu over that card offers adding it to the deck and reading it

#### Scenario: A deck card offers removing and reading

- **WHEN** the player selects a card in the selected deck
- **THEN** a menu over that card offers removing it from the deck and reading it

#### Scenario: Only one menu at a time

- **WHEN** a menu is open and the player selects a different card
- **THEN** the first menu closes and a menu opens over the newly selected card

#### Scenario: A menu can be dismissed

- **WHEN** the player dismisses an open menu
- **THEN** it closes
- **AND** neither the deck nor the collection has changed

#### Scenario: The menu does not move the page

- **WHEN** a menu opens over a card
- **THEN** every other card on the page keeps its position and size

### Requirement: Adding a card from the collection places it in the selected deck

Adding a card SHALL place it in the selected deck's first free position and SHALL show it there
immediately, without the page being reloaded. The collection SHALL be unchanged by the addition:
the card's tile stays and its held count is the same, while its used count rises by one. Where
there is no selected deck, where the selected deck is full, or where the selected deck already uses
every held copy of that card, the add action SHALL NOT be offered, and the page SHALL state why.
Adding a card that makes the deck Invalid SHALL be offered and SHALL succeed. The deck's standing
then states the problem.

#### Scenario: An added card appears in the deck

- **WHEN** the player adds a card from the collection
- **THEN** it occupies the next free position of the deck in the pinned region
- **AND** one fewer position renders as empty

#### Scenario: Adding costs nothing from the collection

- **WHEN** the player adds a card they hold one copy of
- **THEN** that card's tile is still in the collection
- **AND** its badge still states one held, now with one used

#### Scenario: The same card can be added repeatedly

- **WHEN** the player holds three copies of a card and adds it to an empty deck three times
- **THEN** the deck holds three copies of it
- **AND** the collection is unchanged throughout

#### Scenario: Using every copy withholds the action

- **WHEN** the player selects a collection card whose every held copy the selected deck already
  uses
- **THEN** the menu does not offer adding it
- **AND** the page states that every copy held is already in that deck

#### Scenario: The copy limit is per deck

- **WHEN** a player holding one copy of a card has it in Deck 1 and selects Deck 2
- **THEN** the menu for that card offers adding it to Deck 2

#### Scenario: Removing a copy offers adding again

- **WHEN** the deck uses every held copy of a card and the player removes one of them
- **THEN** the menu for that card offers adding it again

#### Scenario: A card that breaks the rarity limit can still be added

- **WHEN** the player selects a four-star card while the selected deck already holds a different
  four-star card and has a free position
- **THEN** the menu offers adding it
- **AND** adding it places it in the deck and the region states the deck is invalid

#### Scenario: A full deck does not offer the action

- **WHEN** the player selects a collection card while the selected deck holds nine cards
- **THEN** the menu does not offer adding it
- **AND** the page states that the deck is full

#### Scenario: No deck means no adding

- **WHEN** the player selects a collection card while holding no decks
- **THEN** the menu does not offer adding it
- **AND** the page states that a deck must be created first

### Requirement: Removing a card from the deck frees exactly that position

Removing a card SHALL take out the copy at the position that was selected, leaving the deck's other
cards in their order and freeing one position. The collection SHALL be unchanged.

#### Scenario: One copy of a repeated card is removed

- **WHEN** a deck holds three copies of a card and the player removes the second of them
- **THEN** two copies remain in the deck
- **AND** every other card in the deck is still in its relative order

#### Scenario: Removing frees a position

- **WHEN** the player removes a card from a full deck
- **THEN** the deck shows eight cards and one empty position
- **AND** the region warns that one more card is needed

#### Scenario: Removing returns nothing to the collection

- **WHEN** the player removes a card from the deck
- **THEN** that card's count in the collection is unchanged

### Requirement: Reading a card presents it at a size that shows its ability text

Reading a card SHALL present it through the shared card renderer at a width at or above the width
the renderer shows the ability section at, so that the ability text, the set, and the number are
legible. The reading presentation SHALL be dismissible, SHALL offer the same deck action the card's
menu offered — adding it when read from the collection, removing it when read from the deck — under
the same conditions, and SHALL return the player to the page they were on when dismissed.

#### Scenario: The read card shows what the tile withheld

- **WHEN** the player reads a card from the collection
- **THEN** it is presented with its ability text, its set, and its number visible

#### Scenario: Reading can be dismissed

- **WHEN** the player dismisses the reading presentation
- **THEN** the Decks page is shown as it was
- **AND** neither the deck nor the collection has changed

#### Scenario: A card can be added from where it is read

- **WHEN** the player reads a collection card and adds it from there
- **THEN** it occupies the next free position of the selected deck
- **AND** the same conditions that withhold the action in the menu withhold it here

#### Scenario: A card read from the deck offers removal

- **WHEN** the player reads a card from the selected deck
- **THEN** the presentation offers removing that copy from the deck

### Requirement: Deck edits take effect at once and are never saved by hand

Every change the player makes on the Decks page — creating a deck, deleting a deck, adding a card,
removing a card — SHALL take effect immediately and SHALL be durable. The page SHALL present no
save control, no unsaved state, and no confirmation of persistence.

#### Scenario: No save step exists

- **WHEN** the player views the Decks page
- **THEN** no control that saves, applies, or commits deck changes is presented

#### Scenario: Edits survive a reload

- **WHEN** the player builds a deck and then reloads the application
- **THEN** the Decks page shows that deck with the same cards in the same positions

### Requirement: The Decks page honours a reduced-motion preference

Where the player's environment asks for reduced motion, the page's entrances and transitions — the
collection's arrival, the collection's reorder, a card taking its place in the deck, a menu,
confirmation, or reading presentation opening — SHALL be reduced to an immediate state change.
Every state the motion would have carried SHALL remain distinguishable without it.

#### Scenario: Motion is removed, not the information

- **WHEN** the Decks page is used with a reduced-motion preference expressed
- **THEN** cards, menus, and the reading presentation appear without animation
- **AND** the selected deck button, the selected card, and a card's place in the deck are all
  still distinguishable

#### Scenario: A reorder is immediate under reduced motion

- **WHEN** the player changes the collection's order with a reduced-motion preference expressed
- **THEN** the tiles appear in their new order without animation

### Requirement: Every card the Decks page renders obeys the card design constraints

Every card the Decks page renders — in the collection, in a deck position, or read at full size —
SHALL be rendered by the shared card renderer and SHALL follow the established card design
contract: the 2.5:3.5 aspect ratio, the four sections, chevron placement, rarity stars, and
numeral-free stat bars. The page's own overlays — the count badge, the action menu, the reading
presentation's chrome — are the page's, not the card's, and MUST NOT alter what the renderer draws.

#### Scenario: A card is displayed

- **WHEN** the Decks page displays a card
- **THEN** that card is rendered by the shared card component and satisfies the card design constraints

#### Scenario: The page's overlays leave the card alone

- **WHEN** the page draws a count badge or an action menu over a card
- **THEN** the card beneath it is unchanged in structure, proportions, and internal layout

#### Scenario: The ratio holds at every size the page uses

- **WHEN** cards are rendered as collection tiles, as deck positions, and read at full size
- **THEN** each holds the 2.5 : 3.5 ratio

### Requirement: The Decks page is headed by the single-line screen header

The Decks page SHALL name itself with the design system's single-line screen header, titled
`Decks`, at the top of the pinned region. The page SHALL declare no heading treatment of its own
beside it. At every viewport the page supports, the header SHALL occupy a single line.

#### Scenario: The page is titled on one line

- **WHEN** the Decks page renders at any viewport size it supports
- **THEN** its title `Decks` is presented by the single-line screen header
- **AND** the header occupies a single line

#### Scenario: The page composes the primitive

- **WHEN** the Decks page's header is inspected
- **THEN** it is the shared single-line screen header
- **AND** the page declares no competing title or ornament styling of its own

### Requirement: The selected deck's standing is stated beneath its positions

Beneath the selected deck's nine positions, the pinned region SHALL state the deck's standing in
plain words:

- **Invalid**: an error naming the broken rule and what to remove. For example, the deck holds two
  cards of four stars or more, only one is allowed, and one must be removed.
- **Incomplete**: a warning stating how many more cards the deck needs to be ready for battle, and
  that they can be added from the collection below.
- **Ready**: a quiet confirmation that the deck is ready for battle.

Where a deck is both Invalid and Incomplete, both SHALL be stated, with the error first.

The error SHALL use the error status colour and the warning SHALL use the warning status colour. The
warning SHALL read as visibly softer than the error. Neither SHALL rely on colour alone: each SHALL
carry a non-colour cue, such as a distinct mark or a leading word, that tells error from warning
with colour removed.

The statement SHALL follow the deck's contents without the page being reloaded, and SHALL be
announced to assistive technology when it changes.

#### Scenario: An incomplete deck is warned about

- **WHEN** a deck holding four cards, none of four stars or more, is shown
- **THEN** a warning states that five more cards are needed
- **AND** the warning is shown in the warning status colour
- **AND** no error is shown

#### Scenario: An empty deck is warned about

- **WHEN** a deck holding no cards is shown
- **THEN** a warning states that nine cards are needed and can be added from the collection below

#### Scenario: An invalid deck is an error

- **WHEN** a full deck holding two cards of four stars is shown
- **THEN** an error states that only one card of four stars or more is allowed, and one must be
  removed
- **AND** the error is shown in the error status colour
- **AND** no warning is shown

#### Scenario: Both problems are stated, error first

- **WHEN** a deck holding six cards, two of them of four stars, is shown
- **THEN** both the error and the warning are stated
- **AND** the error precedes the warning

#### Scenario: A ready deck says so

- **WHEN** a full deck holding at most one card of four stars or more is shown
- **THEN** the region states that the deck is ready for battle
- **AND** neither an error nor a warning is shown

#### Scenario: Error and warning are told apart without colour

- **WHEN** the error and the warning are rendered with colour removed
- **THEN** each can still be identified as an error or a warning

#### Scenario: The statement follows the deck

- **WHEN** the player adds a second four-star card to a deck
- **THEN** the error appears without the page being reloaded
- **AND** when they remove one of those cards, the error is gone

#### Scenario: No filled count is stated

- **WHEN** a deck is shown at any size
- **THEN** the region does not state how many of the nine positions are filled

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

- **WHEN** the player navigates to the Decks page
- **THEN** the collection is already presented in rarity sections, rarest first

### Requirement: Reordering the collection animates every tile

Whenever the collection's order or direction changes, every tile in the collection SHALL replay
the collection's entrance motion in its new place, staggered in the new reading order. No tile
SHALL be left still because it kept its position or its neighbour. The motion SHALL NOT change
which tile's menu is open, and the order SHALL be in effect as soon as it is chosen; the motion
only presents the order and never holds it back.

#### Scenario: Every tile moves on a reorder

- **WHEN** the player changes the collection from rarity to name
- **THEN** every tile in the collection plays the entrance motion
- **AND** a tile whose position happens not to change plays it too

#### Scenario: Reversing a direction animates too

- **WHEN** the player reverses the order in effect
- **THEN** every tile plays the entrance motion in its new place

#### Scenario: The stagger follows the new order

- **WHEN** the tiles replay the entrance after a reorder
- **THEN** they begin in the new reading order, the first tile first

### Requirement: The player's data can be reset from the Decks page

The Decks page SHALL offer a control that resets the player's data. This is a testing aid,
present in every build. Its face SHALL mark it as a debug tool, so it is not mistaken for part of
the game, and it SHALL sit in the pinned region apart from the deck controls. Activating it SHALL
raise a confirmation that states that the collection, the Geo balance, the Rosary balance, and
every deck will be replaced by a new player's. Declining SHALL change nothing. Confirming SHALL replace the player's
data with exactly what a player created with no prior data holds, SHALL make that replacement
durable, and SHALL show it at once everywhere the user is read, without the page being reloaded.
After a reset the page SHALL show the first deck selected and the collection in its default order.

#### Scenario: The reset control is offered and marked as debug

- **WHEN** the player views the Decks page
- **THEN** a control that resets the player's data is presented in the pinned region
- **AND** its face marks it as a debug tool

#### Scenario: Resetting asks first

- **WHEN** the player activates the reset control
- **THEN** a confirmation is presented stating that cards, Geo, Rosaries, and decks will be
  replaced
- **AND** nothing has been reset yet

#### Scenario: Declining the reset changes nothing

- **WHEN** the player declines the reset confirmation
- **THEN** the collection, the Geo balance, the Rosary balance, and every deck are exactly as they
  were

#### Scenario: Confirming restores a new player

- **WHEN** a player holding several decks, extra cards, Geo, and Rosaries confirms the reset
- **THEN** the collection holds exactly the starter cards, one copy each
- **AND** the Geo balance is zero
- **AND** the Rosary balance is zero
- **AND** exactly one empty deck is held, and it is the deck on screen
- **AND** the collection is ordered by rarity, rarest first

#### Scenario: The reset is durable

- **WHEN** the player confirms the reset and then reloads the application
- **THEN** the reset data is what is restored

#### Scenario: Other surfaces follow the reset

- **WHEN** the player confirms the reset
- **THEN** the Geo balance and the Rosary balance shown anywhere in the application read zero
  without the page being reloaded

### Requirement: The player's decks are presented as a row of deck buttons at the top of the page

The Decks page SHALL present one deck button per deck the player holds, in the decks' own order. The
deck buttons SHALL be styled as the page's ordinary buttons, each a closed, bordered control, and
not as tabs joined to the region below. Exactly one deck SHALL be selected at any time that the
player holds at least one deck. The selected button MUST be distinguishable from the others by more
than colour alone, through the treatment of its face, such as a filled ground and a heavier border.
No deck button SHALL carry a diamond or any other ornament beside its label. Each button SHALL
expose to assistive technology whether it is the selected deck. The page SHALL open on the first
deck.

The selected deck button SHALL show the deck's full positional name, such as `Deck 2`. Every
unselected deck button SHALL show only the deck's numeral, such as `3`, without the word `Deck`.
Every deck button's accessible name SHALL be the deck's full positional name whether or not it is
selected.

#### Scenario: Every deck has a button

- **WHEN** a player holding three decks views the Decks page
- **THEN** three deck buttons are presented, in the order Deck 1, Deck 2, Deck 3
- **AND** the first is selected

#### Scenario: The deck buttons are buttons, not tabs

- **WHEN** the deck buttons are rendered
- **THEN** each is a closed, bordered button in the page's button style
- **AND** none is drawn as a tab opening onto the deck below

#### Scenario: No diamond is drawn

- **WHEN** any deck button is rendered, selected or not
- **THEN** it shows its label and no diamond or other ornament

#### Scenario: Only the selected button says "Deck"

- **WHEN** a player holding three decks views the Decks page with the first deck selected
- **THEN** the deck buttons read `Deck 1`, `2`, and `3`
- **AND** when the player chooses the second, they read `1`, `Deck 2`, and `3`

#### Scenario: Every deck button keeps its full accessible name

- **WHEN** assistive technology reads the deck buttons
- **THEN** each is announced as `Deck 1`, `Deck 2`, and `Deck 3` respectively, whichever is
  selected
- **AND** the selected one is announced as selected or pressed

#### Scenario: Choosing a deck button changes the deck on screen

- **WHEN** the player chooses the button for another deck
- **THEN** that deck becomes the one shown in the pinned region
- **AND** its button is the one marked as selected

#### Scenario: The selected button is not marked by colour alone

- **WHEN** the selected deck button is rendered beside the unselected ones
- **THEN** it is distinguished by a non-colour cue in its face as well as by colour

#### Scenario: A player with no decks is offered one

- **WHEN** a player holding no decks views the Decks page
- **THEN** no deck button is presented and no deck is shown
- **AND** the page states that they have no decks and offers the control that creates one
- **AND** the collection below is still shown in full

### Requirement: A deck can be created from the page until the limit disables the control

The Decks page SHALL offer a control that creates a new, empty deck and selects it. Where the
player already holds the maximum number of decks, that control SHALL remain in place but be
disabled: it SHALL be presented as unavailable, activating it SHALL do nothing, and the reason, that
nine decks is the limit, SHALL be available as the control's tooltip and to assistive technology.

#### Scenario: Creating a deck

- **WHEN** the player activates the control that creates a deck
- **THEN** a new empty deck is added after their last one
- **AND** it becomes the selected deck, with its own deck button
- **AND** its nine positions are all empty

#### Scenario: The limit disables the control

- **WHEN** the player holds nine decks
- **THEN** the control that creates a deck is still presented, in the same place
- **AND** it is presented as disabled
- **AND** activating it creates no deck

#### Scenario: The disabled control says why

- **WHEN** the player hovers or focuses the disabled create control
- **THEN** its tooltip states that nine decks is the limit
- **AND** assistive technology announces it as unavailable along with that reason

#### Scenario: Deleting below the limit re-enables it

- **WHEN** a player holding nine decks deletes one
- **THEN** the create control is enabled again

### Requirement: The deck controls are icons beside the deck buttons, behind a separator

The control that creates a deck SHALL be presented as a **+** icon, and the control that deletes the
deck on screen SHALL be presented as a **trash can** icon. Neither SHALL show a text label on its
face. Each SHALL keep an accessible name that says what it does: `New deck` for the first, and
`Delete` followed by the deck's name, such as `Delete Deck 2`, for the second. Each SHALL show its
name as a tooltip on pointer hover and on keyboard focus. While disabled at the deck limit, the
create control's tooltip SHALL state the limit instead.

The two controls SHALL sit together in a group immediately after the last deck button, set apart
from the deck buttons by spacing and by a visible separator, so that neither reads as another deck.
The deck buttons, the separator, and the control group SHALL be laid out as one row centred on the
page as a whole, so the row's centre moves as decks are added or removed. Where the row's content
wraps, the separator and controls SHALL stay together after the last deck button.

#### Scenario: The controls are icons with names

- **WHEN** the deck controls are rendered
- **THEN** the create control shows a + icon and the delete control shows a trash can icon
- **AND** neither shows a text label on its face
- **AND** assistive technology announces them as `New deck` and `Delete Deck 1` respectively

#### Scenario: Names are available on hover and focus

- **WHEN** the player hovers or focuses either control
- **THEN** a tooltip naming its action is shown

#### Scenario: The controls follow the deck buttons behind a separator

- **WHEN** the deck buttons and the deck controls are rendered together
- **THEN** the controls come directly after the last deck button
- **AND** a visible separator and space stand between the last deck button and the first control
- **AND** the controls are not styled as deck buttons

#### Scenario: The whole row is centred

- **WHEN** a player holding one deck, and then one holding five, views the Decks page
- **THEN** in each case the row of deck buttons, separator, and controls is centred horizontally
  on the page

#### Scenario: The group holds together as decks are added

- **WHEN** the player creates decks until the limit is reached
- **THEN** the separator and the control group stay directly after the last deck button
  throughout
- **AND** at the limit the + icon is still present, disabled

### Requirement: Every action on the Decks page is operable by keyboard

Every action the Decks page offers SHALL be reachable and operable by keyboard, with a visible
focus indicator: choosing a deck button, creating and deleting a deck, choosing an order and
reversing its direction, resetting the player's data, selecting a card, taking either action from
the menu, and dismissing the menu, a confirmation, or the reading presentation. A disabled create
control SHALL remain focusable so its reason can be read. While the reading presentation is open,
keyboard focus SHALL be confined to it, and on dismissal SHALL return to the card it was opened
from.

#### Scenario: The deck buttons are reachable by keyboard

- **WHEN** the player navigates the pinned region by keyboard
- **THEN** each deck button receives focus with a visible indicator
- **AND** the selected deck can be changed without a pointer

#### Scenario: The order and its direction are operable by keyboard

- **WHEN** the player focuses the active order and activates it by keyboard
- **THEN** its direction reverses

#### Scenario: The disabled create control can still be focused

- **WHEN** the player holds nine decks and tabs through the deck controls
- **THEN** the disabled create control receives focus and shows its reason

#### Scenario: A card's actions are reachable by keyboard

- **WHEN** a card receives keyboard focus and is activated
- **THEN** its menu opens and its actions can be reached and taken by keyboard
- **AND** the menu can be dismissed by keyboard

#### Scenario: Focus is managed around reading a card

- **WHEN** the reading presentation is opened by keyboard and then dismissed
- **THEN** focus was confined to it while it was open
- **AND** focus returns to the card it was opened from

### Requirement: The Decks page draws no corner frame

The Decks page SHALL NOT draw the design system's corner-frame brackets at its edges or anywhere
else on the page. The page's atmosphere (the void background, the mist, and the soul particles)
SHALL remain.

#### Scenario: No corner brackets are drawn

- **WHEN** the Decks page renders at any supported viewport
- **THEN** no corner-frame bracket is present at any corner of the page

#### Scenario: The atmosphere remains

- **WHEN** the Decks page renders
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
