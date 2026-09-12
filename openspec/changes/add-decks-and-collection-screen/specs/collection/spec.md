## ADDED Requirements

### Requirement: The Cards page presents the player's real collection and decks

The Cards page SHALL present the player's actual holdings: the cards their collection holds and the
decks they have built. What it shows MUST be read from the one user the application maintains, so
that a card granted elsewhere — by a pack, by the starter seed — appears here without the page
being reloaded, and a deck edited here is the deck every other reader of the user sees.

#### Scenario: The page shows what the player owns

- **WHEN** the player navigates to the Cards page
- **THEN** the cards shown are the cards their collection holds
- **AND** no card the collection does not hold is presented as owned

#### Scenario: A card won elsewhere is here on arrival

- **WHEN** the player opens a pack in the Shop and then navigates to the Cards page
- **THEN** the cards that pack granted are present in the collection
- **AND** the count shown for a card they already held has risen

#### Scenario: The page presents nothing as forthcoming that it can show

- **WHEN** the player views the Cards page
- **THEN** the collection and the deck being built are presented as real, usable player data
- **AND** neither is marked as a placeholder or as coming later

### Requirement: The player's decks are presented as a tab strip at the top of the page

The Cards page SHALL present one tab per deck the player holds, in the decks' own order, each
labelled by that deck's positional name. Exactly one deck SHALL be selected at any time that the
player holds at least one deck, and the selected tab MUST be distinguishable from the others by
more than colour alone. The page SHALL open on the first deck.

#### Scenario: Every deck has a tab

- **WHEN** a player holding three decks views the Cards page
- **THEN** three tabs are presented, labelled `Deck 1`, `Deck 2`, and `Deck 3`
- **AND** the first is selected

#### Scenario: Choosing a tab changes the deck on screen

- **WHEN** the player chooses the tab for another deck
- **THEN** that deck becomes the one shown in the pinned region
- **AND** its tab is the one marked as selected

#### Scenario: The selected tab is not marked by colour alone

- **WHEN** the selected tab is rendered beside the unselected ones
- **THEN** it is distinguished by a non-colour cue as well as by colour

#### Scenario: A player with no decks is offered one

- **WHEN** a player holding no decks views the Cards page
- **THEN** no deck tab is presented and no deck is shown
- **AND** the page states that they have no decks and offers the control that creates one
- **AND** the collection below is still shown in full

### Requirement: The selected deck is pinned above the collection

The selected deck SHALL occupy a region pinned to the top of the page, above the collection, and
that region SHALL remain visible while the collection is scrolled. The deck tabs, the deck's
positions, the control that creates a deck, the control that deletes the deck on screen, and the
control that orders the collection SHALL all sit in that pinned region, so that none of them can be
scrolled out of reach.

#### Scenario: The deck stays put while the collection moves

- **WHEN** the player scrolls the collection
- **THEN** the selected deck, its tabs, and the page's controls remain visible in place
- **AND** only the collection moves

#### Scenario: The deck is above the collection

- **WHEN** the Cards page is rendered
- **THEN** the pinned deck region is presented above the collection, not beside or below it

### Requirement: The selected deck shows all nine of its positions

The pinned region SHALL present nine positions for the selected deck. A position holding a card
SHALL render that card through the shared card renderer; a free position SHALL render as a visibly
empty position rather than as nothing at all, so the deck's remaining capacity is legible without
counting. The region SHALL additionally state how many of the nine positions are filled.

#### Scenario: A part-filled deck shows its capacity

- **WHEN** a deck holding four cards is shown
- **THEN** four positions render those four cards in the deck's order
- **AND** five positions render as empty
- **AND** the region states that four of nine positions are filled

#### Scenario: An empty deck is nine empty positions

- **WHEN** a deck holding no cards is shown
- **THEN** nine empty positions are rendered
- **AND** the page states that the deck is empty and can be filled from the collection below

#### Scenario: A full deck reads as full

- **WHEN** a deck holding nine cards is shown
- **THEN** all nine positions render cards
- **AND** the region states that nine of nine positions are filled

### Requirement: A deck can be created from the page

The Cards page SHALL offer a control that creates a new, empty deck and selects it. Where the
player already holds the maximum number of decks, that control SHALL NOT be presented as something
to activate, and the page SHALL state that the limit has been reached.

#### Scenario: Creating a deck

- **WHEN** the player activates the control that creates a deck
- **THEN** a new empty deck is added after their last one
- **AND** it becomes the selected deck, with its own tab
- **AND** its nine positions are all empty

#### Scenario: The limit removes the control rather than disabling it

- **WHEN** the player holds nine decks
- **THEN** no control that creates a deck is presented or reachable
- **AND** the page states that nine decks is the limit

### Requirement: Deleting a deck is confirmed before it happens

The Cards page SHALL offer a control that deletes the deck on screen, and that deletion SHALL be
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

Each collection tile SHALL display the number of copies of that card the collection holds, as a
badge overlaying the bottom of the tile. The badge SHALL be shown for every tile, including a card
held once. It MUST NOT obscure the card's name, its star track, either stat bar, or any of its
eight chevrons, and it SHALL follow the collection's count without the page being reloaded.

#### Scenario: A duplicate is counted

- **WHEN** a card the player holds three copies of is presented
- **THEN** its tile's badge states three

#### Scenario: A single copy is counted too

- **WHEN** a card the player holds one copy of is presented
- **THEN** its tile's badge states one rather than being omitted

#### Scenario: The badge obscures nothing

- **WHEN** a tile's badge is rendered
- **THEN** the card's name, all five star slots, both stat bars with their labels, and all eight
  chevrons remain visible and legible

#### Scenario: The count follows the collection

- **WHEN** the player gains another copy of a card they already hold
- **THEN** that card's badge states the new count without the page being reloaded

### Requirement: The collection can be ordered five ways, each in a stated direction

The page SHALL let the player order the collection by rarity, by quantity held, by name, by attack,
or by defense. Each order SHALL carry its own direction: rarity, quantity, attack, and defense
order highest first; name orders A to Z. The control SHALL name the five orders and SHALL show
which is in effect. Choosing an order SHALL reorder the collection without the page being reloaded
and without changing the deck on screen.

#### Scenario: The five orders are offered and the active one is shown

- **WHEN** the player views the collection's ordering control
- **THEN** rarity, quantity, name, attack, and defense are each offered by name
- **AND** the one currently in effect is marked

#### Scenario: Ordering by rarity puts the rarest first

- **WHEN** the collection is ordered by rarity
- **THEN** cards of a higher star rating precede cards of a lower one

#### Scenario: Ordering by quantity puts the most-held first

- **WHEN** the collection is ordered by quantity
- **THEN** a card held three times precedes a card held once

#### Scenario: Ordering by name runs A to Z

- **WHEN** the collection is ordered by name
- **THEN** the cards read in ascending alphabetical order of their names

#### Scenario: Ordering by a stat puts the highest first

- **WHEN** the collection is ordered by attack, and again by defense
- **THEN** in each case the card with the higher value in that stat precedes the card with the lower

#### Scenario: Reordering leaves the deck alone

- **WHEN** the player changes the collection's order
- **THEN** the selected deck, its contents, and its positions are unchanged

### Requirement: The collection opens ordered by rarity, rarest first

On arrival at the Cards page the collection SHALL be ordered by rarity with the rarest cards first.
The player MUST NOT have to choose an order to see a sensibly ordered collection.

#### Scenario: The default order on arrival

- **WHEN** the player navigates to the Cards page
- **THEN** the collection is already ordered by rarity, rarest first
- **AND** the ordering control shows rarity as the order in effect

### Requirement: Every order is total, so equal cards do not shuffle

Each of the five orders SHALL be a total order over the collection: cards that tie on the chosen
value SHALL be placed by a stated, deterministic tie-break rather than left in an arbitrary order.
The same collection ordered the same way SHALL produce the same sequence every time.

#### Scenario: Ties are broken deterministically

- **WHEN** the collection is ordered by a value on which several cards tie
- **THEN** those cards appear in the same relative order every time that order is applied

#### Scenario: Leaving an order and returning to it restores the sequence

- **WHEN** the player chooses another order and then chooses the first one again
- **THEN** the collection reads in exactly the sequence it did before

#### Scenario: Re-rendering does not reshuffle

- **WHEN** the collection is re-rendered for any reason other than a change of order or of holdings
- **THEN** its sequence is unchanged

### Requirement: Selecting a card raises an action menu over that card

Selecting a card on the Cards page SHALL raise a small menu over that card offering exactly the
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
the card's tile stays, and its count is the same. Where there is no selected deck, or the selected
deck is full, the add action SHALL NOT be offered, and the page SHALL state why.

#### Scenario: An added card appears in the deck

- **WHEN** the player adds a card from the collection
- **THEN** it occupies the next free position of the deck in the pinned region
- **AND** the region's filled count rises by one

#### Scenario: Adding costs nothing from the collection

- **WHEN** the player adds a card they hold one copy of
- **THEN** that card's tile is still in the collection
- **AND** its badge still states one

#### Scenario: The same card can be added repeatedly

- **WHEN** the player adds the same card from the collection nine times to an empty deck
- **THEN** the deck holds nine copies of it
- **AND** the collection is unchanged throughout

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
cards in their order and reducing the filled count by one. The collection SHALL be unchanged.

#### Scenario: One copy of a repeated card is removed

- **WHEN** a deck holds three copies of a card and the player removes the second of them
- **THEN** two copies remain in the deck
- **AND** every other card in the deck is still in its relative order

#### Scenario: Removing frees a position

- **WHEN** the player removes a card from a full deck
- **THEN** the deck shows eight cards and one empty position
- **AND** the region states that eight of nine positions are filled

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
- **THEN** the Cards page is shown as it was
- **AND** neither the deck nor the collection has changed

#### Scenario: A card can be added from where it is read

- **WHEN** the player reads a collection card and adds it from there
- **THEN** it occupies the next free position of the selected deck
- **AND** the same conditions that withhold the action in the menu withhold it here

#### Scenario: A card read from the deck offers removal

- **WHEN** the player reads a card from the selected deck
- **THEN** the presentation offers removing that copy from the deck

### Requirement: Deck edits take effect at once and are never saved by hand

Every change the player makes on the Cards page — creating a deck, deleting a deck, adding a card,
removing a card — SHALL take effect immediately and SHALL be durable. The page SHALL present no
save control, no unsaved state, and no confirmation of persistence.

#### Scenario: No save step exists

- **WHEN** the player views the Cards page
- **THEN** no control that saves, applies, or commits deck changes is presented

#### Scenario: Edits survive a reload

- **WHEN** the player builds a deck and then reloads the application
- **THEN** the Cards page shows that deck with the same cards in the same positions

### Requirement: The Cards page is operable by keyboard

Every action the Cards page offers SHALL be reachable and operable by keyboard, with a visible
focus indicator: choosing a deck tab, creating and deleting a deck, selecting a card, taking either
action from the menu, and dismissing the menu or the reading presentation. While the reading
presentation is open, keyboard focus SHALL be confined to it, and on dismissal SHALL return to the
card it was opened from.

#### Scenario: The tabs are reachable by keyboard

- **WHEN** the player navigates the pinned region by keyboard
- **THEN** the deck tabs receive focus with a visible indicator
- **AND** the selected deck can be changed without a pointer

#### Scenario: A card's actions are reachable by keyboard

- **WHEN** a card receives keyboard focus and is activated
- **THEN** its menu opens and its actions can be reached and taken by keyboard
- **AND** the menu can be dismissed by keyboard

#### Scenario: Focus is managed around reading a card

- **WHEN** the reading presentation is opened by keyboard and then dismissed
- **THEN** focus was confined to it while it was open
- **AND** focus returns to the card it was opened from

### Requirement: The Cards page honours a reduced-motion preference

Where the player's environment asks for reduced motion, the page's entrances and transitions — the
collection's arrival, a card taking its place in the deck, a menu or reading presentation opening —
SHALL be reduced to an immediate state change. Every state the motion would have carried SHALL
remain distinguishable without it.

#### Scenario: Motion is removed, not the information

- **WHEN** the Cards page is used with a reduced-motion preference expressed
- **THEN** cards, menus, and the reading presentation appear without animation
- **AND** the selected tab, the selected card, and a card's place in the deck are all still
  distinguishable

### Requirement: Every card the Cards page renders obeys the card design constraints

Every card the Cards page renders — in the collection, in a deck position, or read at full size —
SHALL be rendered by the shared card renderer and SHALL follow the established card design
contract: the 2.5:3.5 aspect ratio, the four sections, chevron placement, rarity stars, and
numeral-free stat bars. The page's own overlays — the count badge, the action menu, the reading
presentation's chrome — are the page's, not the card's, and MUST NOT alter what the renderer draws.

#### Scenario: A card is displayed

- **WHEN** the Cards page displays a card
- **THEN** that card is rendered by the shared card component and satisfies the card design constraints

#### Scenario: The page's overlays leave the card alone

- **WHEN** the page draws a count badge or an action menu over a card
- **THEN** the card beneath it is unchanged in structure, proportions, and internal layout

#### Scenario: The ratio holds at every size the page uses

- **WHEN** cards are rendered as collection tiles, as deck positions, and read at full size
- **THEN** each holds the 2.5 : 3.5 ratio

## MODIFIED Requirements

### Requirement: The Cards page fits the viewport

The Cards page SHALL fit within the viewport without clipping its content and SHALL make use of the
space available to it. The page itself SHALL NOT scroll in either axis: the collection is the only
region that scrolls, and the pinned deck region keeps its place. Where the viewport is too small to
lay the deck's nine positions out at the card renderer's minimum supported width, the pinned region
SHALL be uniformly scaled as a whole rather than laying any card out below that minimum.

#### Scenario: Rendering at a range of viewport sizes

- **WHEN** the Cards page renders
- **THEN** its content is fully visible without being clipped

#### Scenario: The page itself does not scroll

- **WHEN** the Cards page is rendered at any viewport size it supports
- **THEN** the document scrolls neither horizontally nor vertically

#### Scenario: Only the collection scrolls

- **WHEN** the collection holds more cards than its region can show
- **THEN** that region scrolls
- **AND** the pinned deck region, its tabs, and the page's controls stay where they are

#### Scenario: A viewport too narrow for the deck scales it

- **WHEN** the viewport cannot host nine deck positions at the card renderer's minimum supported width
- **THEN** the pinned region is uniformly scaled down as a whole
- **AND** no card is laid out below the renderer's minimum supported width

## REMOVED Requirements

### Requirement: Any cards shown obey the card design constraints

**Reason**: The requirement is written for a page that had no real cards to show: it governs "card
artwork — including placeholder or sample cards", and its one scenario asks what happens when "a
sample card is displayed". The Cards page no longer displays samples, and it now renders cards in
three distinct roles — collection tile, deck position, and a card read at full size — over which
the page draws overlays of its own. The obligation has to be stated for those, not for a sample.

**Migration**: Replaced by "Every card the Cards page renders obeys the card design constraints",
which carries the removed requirement in full — the shared renderer, the 2.5:3.5 ratio, the
sections, chevrons, stars, and numeral-free stat bars — and extends it to all three roles and to
the page's own overlays.

### Requirement: The Cards page exists as a themed placeholder

**Reason**: The requirement obliges the page to mark its content as forthcoming and states that it
"does not present an owned-card collection or a saved deck as though it were real player data".
Both are exactly what this change makes the page do: the collection and the decks it shows are the
player's own, read from the one user record and editable in place.

**Migration**: Replaced by the requirements added above, which state what the page presents in place
of the placeholder. The page still names itself as the Cards page and keeps its themed treatment;
that continuity is carried by the surviving "The Cards page fits the viewport" requirement and by
the design system's style guide. Honesty about what is unbuilt is preserved where it is still
needed — the page states plainly when the player has no decks, when a deck is empty, when a deck is
full, and when the deck limit has been reached.
