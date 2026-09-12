## Purpose

Defines what a Hollow Master deck is — a small, ordered selection of cards the player has unlocked,
held alongside their collection — and the rules that bound it: how many decks there may be, how
many cards a deck holds, which cards may be used and how often, and how decks are identified, so
that deck building cannot leave the player's record in a state the game could not play.

## ADDED Requirements

### Requirement: A user holds an ordered list of decks, at most nine

The user SHALL hold a list of decks. That list MUST hold no more than nine decks, and MAY hold
none. The limit SHALL be stated in exactly one place, and every rule that depends on it — whether
another deck may be created, how many tabs the Cards page presents — SHALL derive from that
statement rather than restating it.

#### Scenario: Decks are part of the user

- **WHEN** the user is read
- **THEN** their decks are available alongside their collection and their Geo balance

#### Scenario: A tenth deck is refused

- **WHEN** a user holding nine decks creates another
- **THEN** the creation does not happen
- **AND** the user still holds exactly nine decks, unchanged

#### Scenario: A user may hold no decks

- **WHEN** a user deletes the last deck they hold
- **THEN** the user holds zero decks
- **AND** the user record remains valid and readable

### Requirement: A deck holds from zero to nine cards

A deck SHALL hold between zero and nine cards inclusive. A card SHALL occupy a position in the
deck, and the deck's positions SHALL be contiguous from the first: a deck of four cards occupies
the first four positions and has five free. Adding a card SHALL place it in the first free
position. Adding a card to a full deck SHALL change nothing.

#### Scenario: A new deck is empty

- **WHEN** a deck is created
- **THEN** it holds zero cards
- **AND** all nine of its positions are free

#### Scenario: Cards fill the deck in order

- **WHEN** three cards are added to an empty deck in turn
- **THEN** the deck holds three cards in the order they were added
- **AND** its remaining six positions are free

#### Scenario: A tenth card is refused

- **WHEN** a card is added to a deck already holding nine
- **THEN** the addition does not happen
- **AND** the deck still holds the same nine cards in the same order

### Requirement: Quantity held does not limit use in a deck

A card's quantity in the collection SHALL NOT bound how many times that card may appear in a deck,
nor how many decks it may appear in. Holding at least one copy of a card SHALL permit up to nine of
that card in a single deck and that card in every deck at once. Adding a card to a deck SHALL NOT
reduce, reserve, consume, or otherwise change the collection.

#### Scenario: One copy fills a whole deck

- **WHEN** a player holding exactly one copy of a card adds that card to a deck nine times
- **THEN** the deck holds nine copies of it
- **AND** the collection still reports a quantity of one for that card

#### Scenario: The same card serves several decks

- **WHEN** a player holding one copy of a card adds it to three different decks
- **THEN** all three decks hold that card
- **AND** no deck's contents are affected by another's

#### Scenario: Deck building never spends the collection

- **WHEN** any sequence of additions and removals is applied to any of the user's decks
- **THEN** the collection's quantities and its distinct-card count are unchanged throughout
- **AND** the Geo balance is unchanged throughout

### Requirement: Only unlocked cards may be placed in a deck

A card SHALL be placeable in a deck only where the user's collection holds at least one copy of it.
A card the user does not hold SHALL NOT be added to any deck, and the attempt SHALL change nothing.

#### Scenario: An unowned card is refused

- **WHEN** a card the collection reports a quantity of zero for is added to a deck
- **THEN** the addition does not happen
- **AND** the deck is unchanged

#### Scenario: Unlocking is the only gate

- **WHEN** a card the collection holds exactly one copy of is added to a deck
- **THEN** the addition succeeds
- **AND** it succeeds again for the same card and the same deck

### Requirement: Removing a card takes out exactly one copy

Removing a card from a deck SHALL name the position it occupies, not merely the card, so that one
copy of a repeated card can be taken out without disturbing the others. The removal SHALL reduce
the deck's size by exactly one and SHALL leave the remaining cards in the order they were in, with
the positions contiguous from the first. Naming a position no card occupies SHALL change nothing.

#### Scenario: One of several copies is removed

- **WHEN** a deck holding three copies of a card has the copy at the second of them removed
- **THEN** the deck holds two copies of that card
- **AND** every other card in the deck is still present and in its original relative order

#### Scenario: The deck closes up behind a removal

- **WHEN** a card is removed from the middle of a deck of six
- **THEN** the deck holds five cards occupying the first five positions
- **AND** no free position sits between two cards

#### Scenario: Removing from an empty position changes nothing

- **WHEN** a removal names a position the deck does not occupy
- **THEN** the deck is unchanged

### Requirement: Decks are named by their position

A deck SHALL be identified by its position in the user's list, and named from it: the first deck is
`Deck 1`, the second `Deck 2`, and so on. The numbering SHALL be contiguous from 1 with no gaps,
so deleting a deck renumbers every deck after it. A deck SHALL carry no stored name, and the player
SHALL NOT be asked to supply one.

#### Scenario: Decks are numbered from one

- **WHEN** a user holding three decks reads their names
- **THEN** they are `Deck 1`, `Deck 2`, and `Deck 3`

#### Scenario: A deletion renumbers what follows

- **WHEN** a user holding three decks deletes the second
- **THEN** the deck formerly named `Deck 3` is now named `Deck 2`
- **AND** its contents are unchanged

#### Scenario: Creating a deck never asks for a name

- **WHEN** a deck is created
- **THEN** it is immediately usable and already named by its position
- **AND** no name is requested, stored, or editable

### Requirement: A new deck is appended and a deleted deck takes its contents with it

Creating a deck SHALL append an empty deck after the last one the user holds. Deleting a deck SHALL
remove it and the cards it held, SHALL leave every other deck's contents untouched, and SHALL leave
the collection and the Geo balance unchanged.

#### Scenario: A created deck goes on the end

- **WHEN** a user holding two decks creates a deck
- **THEN** they hold three decks
- **AND** the new one is the third, and is empty

#### Scenario: Deleting a deck does not disturb the others

- **WHEN** a user holding three decks with different contents deletes the first
- **THEN** they hold two decks
- **AND** each holds exactly the cards it held before

#### Scenario: Deleting a deck costs no cards

- **WHEN** a deck holding nine cards is deleted
- **THEN** the collection's quantities are unchanged
- **AND** every card the deck held is still available to any other deck

### Requirement: A new user is seeded with one empty deck

A user created with no prior data SHALL hold exactly one deck, and that deck SHALL be empty.

#### Scenario: A new player has a deck to fill

- **WHEN** a user is created with no prior data
- **THEN** they hold exactly one deck
- **AND** it holds zero cards

#### Scenario: The seeded deck is nothing but a deck

- **WHEN** a new user's seeded deck is read
- **THEN** it names itself `Deck 1` by its position
- **AND** it carries no cards the player did not put in it

### Requirement: A refused deck operation changes nothing and says so

Every operation on a deck SHALL either apply in full or change nothing at all, and SHALL report
which of the two happened. An operation that would break a stated limit — a tenth deck, a tenth
card, an unowned card, a position no card occupies, a deck that does not exist — SHALL be refused
rather than truncated, clamped, or partially applied, and MUST NOT raise an error the caller has to
recover from.

#### Scenario: A refusal is reported

- **WHEN** an operation that would break a stated limit is attempted
- **THEN** it reports that it did not happen
- **AND** the user's decks, collection, and balance are all unchanged

#### Scenario: A refusal is not an error

- **WHEN** any refused operation is attempted
- **THEN** no error is raised
- **AND** the application continues normally

#### Scenario: An operation naming a deck that does not exist changes nothing

- **WHEN** an operation names a deck beyond the ones the user holds
- **THEN** nothing is created, deleted, or edited
