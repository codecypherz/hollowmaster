## ADDED Requirements

### Requirement: The Cards page is headed by the single-line screen header

The Cards page SHALL name itself with the design system's single-line screen header, titled
`Cards`, at the top of the pinned region. The page SHALL declare no heading treatment of its own
beside it. At every viewport the page supports, the header SHALL occupy a single line.

#### Scenario: The page is titled on one line

- **WHEN** the Cards page renders at any viewport size it supports
- **THEN** its title `Cards` is presented by the single-line screen header
- **AND** the header occupies a single line

#### Scenario: The page composes the primitive

- **WHEN** the Cards page's header is inspected
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

### Requirement: The deck controls are icons set apart from the tabs

The control that creates a deck SHALL be presented as a **+** icon, and the control that deletes the
deck on screen SHALL be presented as a **trash can** icon. Neither SHALL show a text label on its
face. Each SHALL keep an accessible name that says what it does: `New deck` for the first, and
`Delete` followed by the deck's name, such as `Delete Deck 2`, for the second. Each SHALL show its
name as a tooltip on pointer hover and on keyboard focus.

The two controls SHALL sit together in a group visibly set apart from the tab strip, by spacing and
by a visible separator, so that neither reads as another deck tab. The group SHALL keep its place
when the number of tabs changes. Where the deck limit removes the create control, the statement that
the limit has been reached SHALL sit in that same group.

#### Scenario: The controls are icons with names

- **WHEN** the deck controls are rendered
- **THEN** the create control shows a + icon and the delete control shows a trash can icon
- **AND** neither shows a text label on its face
- **AND** assistive technology announces them as `New deck` and `Delete Deck 1` respectively

#### Scenario: Names are available on hover and focus

- **WHEN** the player hovers or focuses either control
- **THEN** a tooltip naming its action is shown

#### Scenario: The controls are apart from the tabs

- **WHEN** the deck tabs and the deck controls are rendered together
- **THEN** a visible separator and space stand between the last tab and the first control
- **AND** the controls are not styled as tabs

#### Scenario: The group holds its place as decks are added

- **WHEN** the player creates decks until the limit is reached
- **THEN** the control group stays set apart from the tabs throughout
- **AND** at the limit, the group states that nine decks is the limit in place of the + icon

## MODIFIED Requirements

### Requirement: The player's decks are presented as a tab strip at the top of the page

The Cards page SHALL present one tab per deck the player holds, in the decks' own order. Exactly one
deck SHALL be selected at any time that the player holds at least one deck, and the selected tab
MUST be distinguishable from the others by more than colour alone. The page SHALL open on the first
deck.

The selected tab SHALL show the deck's full positional name, such as `Deck 2`. Every unselected tab
SHALL show only the deck's numeral, such as `3`, without the word `Deck`. Every tab's accessible name
SHALL be the deck's full positional name whether or not it is selected.

#### Scenario: Every deck has a tab

- **WHEN** a player holding three decks views the Cards page
- **THEN** three tabs are presented, in the order Deck 1, Deck 2, Deck 3
- **AND** the first is selected

#### Scenario: Only the selected tab says "Deck"

- **WHEN** a player holding three decks views the Cards page with the first deck selected
- **THEN** the tabs read `Deck 1`, `2`, and `3`
- **AND** when the player chooses the second tab, the tabs read `1`, `Deck 2`, and `3`

#### Scenario: Every tab keeps its full accessible name

- **WHEN** assistive technology reads the tab strip
- **THEN** each tab is announced as `Deck 1`, `Deck 2`, and `Deck 3` respectively, whichever is
  selected

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

### Requirement: Adding a card from the collection places it in the selected deck

Adding a card SHALL place it in the selected deck's first free position and SHALL show it there
immediately, without the page being reloaded. The collection SHALL be unchanged by the addition:
the card's tile stays, and its count is the same. Where there is no selected deck, or the selected
deck is full, the add action SHALL NOT be offered, and the page SHALL state why. Adding a card that
makes the deck Invalid SHALL be offered and SHALL succeed. The deck's standing then states the
problem.

#### Scenario: An added card appears in the deck

- **WHEN** the player adds a card from the collection
- **THEN** it occupies the next free position of the deck in the pinned region
- **AND** one fewer position renders as empty

#### Scenario: Adding costs nothing from the collection

- **WHEN** the player adds a card they hold one copy of
- **THEN** that card's tile is still in the collection
- **AND** its badge still states one

#### Scenario: The same card can be added repeatedly

- **WHEN** the player adds the same card from the collection nine times to an empty deck
- **THEN** the deck holds nine copies of it
- **AND** the collection is unchanged throughout

#### Scenario: A card that breaks the rarity limit can still be added

- **WHEN** the player selects a four-star card while the selected deck already holds one and has a
  free position
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
