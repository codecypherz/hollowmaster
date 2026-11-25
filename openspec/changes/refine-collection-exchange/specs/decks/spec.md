## ADDED Requirements

### Requirement: Selecting a card on the Decks page reads it

Selecting a card on the Decks page, in the collection or in the selected deck, SHALL open the
reading presentation for that card at once, with no menu or other step between. Nothing SHALL be
raised over the card itself. Opening and dismissing the presentation MUST NOT change, reorder,
resize, or scroll the deck or the collection.

#### Scenario: A collection card is read

- **WHEN** the player selects a card in the collection
- **THEN** the reading presentation opens showing that card

#### Scenario: A deck card is read

- **WHEN** the player selects a card in the selected deck
- **THEN** the reading presentation opens showing that card

#### Scenario: No menu is raised

- **WHEN** the player selects any card on the page
- **THEN** no action menu appears over it

#### Scenario: The page does not move

- **WHEN** the reading presentation is opened and dismissed
- **THEN** every card on the page has the position and size it had before

### Requirement: Every collection tile offers adding its card

Every collection tile SHALL show, beneath its card, a button that adds the card to the selected
deck, without the player hovering, focusing, or selecting anything first. Its face SHALL name the
deck, such as `Add to Deck 1`, and its accessible name SHALL also name the card. Where no deck is
selected, its face SHALL read `Add to deck`. Where the add cannot be taken, the button SHALL stay in
place and keep its face but be unavailable: it SHALL remain focusable, activating it SHALL do
nothing, and the reason SHALL be available as its tooltip and to assistive technology. Availability
MUST NOT be conveyed by colour alone, and MUST NOT change the size or position of the tile. The
button MUST NOT overlap the card or its count badge. Activating it SHALL NOT open the reading
presentation, and focus SHALL stay on it.

#### Scenario: The button is always there

- **WHEN** the Decks page renders with a deck selected
- **THEN** every collection tile shows a button reading `Add to Deck 1` beneath its card

#### Scenario: The button follows the selected deck

- **WHEN** the player chooses the button for Deck 2
- **THEN** every tile's button reads `Add to Deck 2`

#### Scenario: Adding from the tile

- **WHEN** the player activates a tile's add button
- **THEN** the card takes the deck's next free position and no reading presentation opens
- **AND** focus is still on that button

#### Scenario: An unavailable add keeps its place

- **WHEN** the selected deck uses every held copy of a card
- **THEN** that card's button is still shown, with the same face, size, and position, and is
  unavailable
- **AND** its tooltip and accessible description state that every copy held is already in that deck

#### Scenario: An unavailable add does nothing

- **WHEN** the player activates an unavailable add button by pointer or keyboard
- **THEN** the deck is unchanged

#### Scenario: The button obscures nothing

- **WHEN** a tile is rendered
- **THEN** its add button overlaps neither the card nor the count badge

### Requirement: Every filled deck position offers removing its card

Every filled position of the selected deck SHALL show, beneath its card, a button reading `Remove`
that takes out the copy at that position, without the player hovering, focusing, or selecting
anything first. Its accessible name SHALL name the card and the deck. A free position SHALL show no
button, and SHALL keep the same size as a filled one, so that filling or freeing a position moves
nothing in the region. The button MUST NOT overlap the card. It SHALL be scaled with the rest of the
pinned region where the region is scaled. Activating it SHALL NOT open the reading presentation.
Focus SHALL then move to the remove button now at that position, else to that of the deck's last
card, else to the selected deck's button.

#### Scenario: The button is always there

- **WHEN** a deck holding four cards is shown
- **THEN** four positions show a `Remove` button and five show none

#### Scenario: Removing from the position

- **WHEN** the player activates the remove button of the second of three cards
- **THEN** the second card is taken out and no reading presentation opens
- **AND** focus is on the remove button of the card now second

#### Scenario: Removing the last card in order

- **WHEN** the player activates the remove button of the third of three cards
- **THEN** focus is on the remove button of the second card

#### Scenario: Removing the only card

- **WHEN** the player activates the remove button of a deck's only card
- **THEN** focus is on the selected deck's button

#### Scenario: Filling a position moves nothing

- **WHEN** a card is added to an empty deck
- **THEN** every position keeps its size and the collection below keeps its place

## MODIFIED Requirements

### Requirement: A collection tile states how many copies are held

Each collection tile SHALL display, as a badge overlaying the bottom of the tile, the number of
copies of that card the collection holds and, while a deck is selected, the number of those copies
the selected deck uses. The badge SHALL be shown for every tile, including a card held once and a
card the deck does not use. Its wording or layout SHALL make clear which number is held and which is
used, for example `2 / 3` with the used number first and visually subordinate to the held number.
Where the two numbers are parted by a separator, such as the `/`, the separator SHALL be plainly
visible at the badge's size, in both the normal and the exhausted treatment: drawn with at least the
stroke weight and contrast of the used number, rather than as a faint hairline. Its accessible name
SHALL state both in words, such as `2 of 3 in Deck 1`. Where every held copy is used, the badge
SHALL invert to a light fill with dark figures, so that the exhausted state differs in lightness as
well as hue, and SHALL carry no checkmark or other added mark. Where no deck is selected, the badge
SHALL state only the held count and SHALL NOT be inverted.

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
- **THEN** the badge is inverted, light with dark figures, and can be told from one that is not with
  colour removed
- **AND** it shows the two counts and no checkmark

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

### Requirement: Adding a card from the collection places it in the selected deck

Adding a card SHALL place it in the selected deck's first free position and SHALL show it there
immediately, without the page being reloaded. The collection SHALL be unchanged by the addition: the
card's tile stays and its held count is the same, while its used count rises by one. Where there is
no selected deck, where the selected deck is full, or where the selected deck already uses every
held copy of that card, the add SHALL be unavailable wherever it is offered, and the page SHALL
state why. Adding a card that makes the deck Invalid SHALL be offered and SHALL succeed. The deck's
standing then states the problem.

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

- **WHEN** the selected deck already uses every held copy of a collection card
- **THEN** adding it is unavailable
- **AND** the page states that every copy held is already in that deck

#### Scenario: The copy limit is per deck

- **WHEN** a player holding one copy of a card has it in Deck 1 and selects Deck 2
- **THEN** adding that card to Deck 2 is available

#### Scenario: Removing a copy offers adding again

- **WHEN** the deck uses every held copy of a card and the player removes one of them
- **THEN** adding that card is available again

#### Scenario: A card that breaks the rarity limit can still be added

- **WHEN** the selected deck holds a four-star card and has a free position, and the collection
  holds a different four-star card
- **THEN** adding that card is available
- **AND** adding it places it in the deck and the region states the deck is invalid

#### Scenario: A full deck does not offer the action

- **WHEN** the selected deck holds nine cards
- **THEN** adding any collection card is unavailable
- **AND** the page states that the deck is full

#### Scenario: No deck means no adding

- **WHEN** the player holds no decks
- **THEN** adding any collection card is unavailable
- **AND** the page states that a deck must be created first

### Requirement: Reading a card presents it at a size that shows its ability text

Reading a card SHALL present it through the shared card renderer at a width at or above the width
the renderer shows the ability section at, so that the ability text, the set, and the number are
legible. The reading presentation SHALL be dismissible, SHALL offer the same deck action the card
offers on the page — adding it when read from the collection, removing it when read from the deck —
under the same conditions and giving the same reasons, and SHALL return the player to the page they
were on when dismissed.

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
- **AND** the same conditions that make the tile's add unavailable withhold it here, with the same
  reason

#### Scenario: A card read from the deck offers removal

- **WHEN** the player reads a card from the selected deck
- **THEN** the presentation offers removing that copy from the deck

### Requirement: The Decks page honours a reduced-motion preference

Where the player's environment asks for reduced motion, the page's entrances and transitions — the
collection's arrival, the collection's reorder, a card taking its place in the deck, a confirmation
or the reading presentation opening — SHALL be reduced to an immediate state change.
Every state the motion would have carried SHALL remain distinguishable without it.

#### Scenario: Motion is removed, not the information

- **WHEN** the Decks page is used with a reduced-motion preference expressed
- **THEN** cards and the reading presentation appear without animation
- **AND** the selected deck button, an unavailable add, and a card's place in the deck are all still
  distinguishable

#### Scenario: A reorder is immediate under reduced motion

- **WHEN** the player changes the collection's order with a reduced-motion preference expressed
- **THEN** the tiles appear in their new order without animation

### Requirement: Every card the Decks page renders obeys the card design constraints

Every card the Decks page renders — in the collection, in a deck position, or read at full size —
SHALL be rendered by the shared card renderer and SHALL follow the established card design
contract: the 2.5:3.5 aspect ratio, the four sections, chevron placement, rarity stars, and
numeral-free stat bars. The page's own additions — the count badge, the add and remove buttons, the
reading presentation's chrome — are the page's, not the card's, and MUST NOT alter what the renderer
draws.

#### Scenario: A card is displayed

- **WHEN** the Decks page displays a card
- **THEN** that card is rendered by the shared card component and satisfies the card design
  constraints

#### Scenario: The page's overlays leave the card alone

- **WHEN** the page draws a count badge over a card, or a button beneath it
- **THEN** the card is unchanged in structure, proportions, and internal layout

#### Scenario: The ratio holds at every size the page uses

- **WHEN** cards are rendered as collection tiles, as deck positions, and read at full size
- **THEN** each holds the 2.5 : 3.5 ratio

### Requirement: Reordering the collection animates every tile

Whenever the collection's order or direction changes, every tile in the collection SHALL replay
the collection's entrance motion in its new place, staggered in the new reading order. No tile
SHALL be left still because it kept its position or its neighbour. The order SHALL be in effect as
soon as it is chosen; the motion only presents the order and never holds it back.

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

### Requirement: Every action on the Decks page is operable by keyboard

Every action the Decks page offers SHALL be reachable and operable by keyboard, with a visible focus
indicator: choosing a deck button, creating and deleting a deck, choosing an order and reversing its
direction, resetting the player's data, reading a card, adding a card, removing a card, and
dismissing a confirmation or the reading presentation. A disabled create control and an unavailable
add SHALL remain focusable so their reasons can be read. Within a tile or a deck position, the card
SHALL receive focus before its button. While the reading presentation is open, keyboard focus SHALL
be confined to it, and on dismissal SHALL return to the card it was opened from.

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
- **THEN** its reading presentation opens and can be dismissed by keyboard
- **AND** the next stop after the card is its add or remove button, which can be activated by
  keyboard

#### Scenario: An unavailable add can be focused

- **WHEN** the player tabs to a tile's unavailable add button
- **THEN** it receives focus and its reason is available

#### Scenario: Focus is managed around reading a card

- **WHEN** the reading presentation is opened by keyboard and then dismissed
- **THEN** focus was confined to it while it was open
- **AND** focus returns to the card it was opened from

## REMOVED Requirements

### Requirement: Selecting a card raises an action menu over that card

**Reason**: Selecting a card now reads it, and the actions the menu held are always on screen, so
the two screens treat a card alike.

**Migration**: Reading moves to "Selecting a card on the Decks page reads it". Adding and removing
move to "Every collection tile offers adding its card" and "Every filled deck position offers
removing its card".
