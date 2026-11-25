## MODIFIED Requirements

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

- **WHEN** the selected deck holds two four-star cards and has a free position, and the collection
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

### Requirement: The selected deck's standing is stated beneath its positions

Beneath the selected deck's nine positions, the pinned region SHALL state the deck's standing in
plain words:

- **Invalid**: an error naming the broken rule and what to remove. For example, the deck holds three
  cards of four stars or more, only two are allowed, and one must be removed.
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

- **WHEN** a full deck holding three cards of four stars is shown
- **THEN** an error states that only two cards of four stars or more are allowed, and one must be
  removed
- **AND** the error is shown in the error status colour
- **AND** no warning is shown

#### Scenario: Both problems are stated, error first

- **WHEN** a deck holding six cards, three of them of four stars, is shown
- **THEN** both the error and the warning are stated
- **AND** the error precedes the warning

#### Scenario: A ready deck says so

- **WHEN** a full deck holding at most two cards of four stars or more is shown
- **THEN** the region states that the deck is ready for battle
- **AND** neither an error nor a warning is shown

#### Scenario: Error and warning are told apart without colour

- **WHEN** the error and the warning are rendered with colour removed
- **THEN** each can still be identified as an error or a warning

#### Scenario: The statement follows the deck

- **WHEN** the player adds a third four-star card to a deck
- **THEN** the error appears without the page being reloaded
- **AND** when they remove one of those cards, the error is gone

#### Scenario: No filled count is stated

- **WHEN** a deck is shown at any size
- **THEN** the region does not state how many of the nine positions are filled
