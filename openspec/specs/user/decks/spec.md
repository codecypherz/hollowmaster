# user/decks Specification

## Purpose
Defines what a Hollow Master deck is — a small, ordered selection of cards the player has unlocked,
held alongside their collection — and the rules that bound it: how many decks there may be, how
many cards a deck holds, which cards may be used and how often, and how decks are identified, so
that deck building cannot leave the player's record in a state the game could not play.

## Requirements

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
which of the two happened. An operation that would break a stated limit SHALL be refused rather
than truncated, clamped, or partially applied, and MUST NOT raise an error the caller has to
recover from. The stated limits are a tenth deck, a tenth card, an unowned card, more copies of a
card than are held, a position no card occupies, and a deck that does not exist.

#### Scenario: A refusal is reported

- **WHEN** an operation that would break a stated limit is attempted
- **THEN** it reports that it did not happen
- **AND** the user's decks, collection, and balance are all unchanged

#### Scenario: A refusal is not an error

- **WHEN** any refused operation is attempted
- **THEN** no error is raised
- **AND** the application continues normally

#### Scenario: An addition beyond the copies held is refused cleanly

- **WHEN** a card is added to a deck that already holds as many copies of it as the collection does
- **THEN** it reports that it did not happen
- **AND** the deck is unchanged

#### Scenario: An operation naming a deck that does not exist changes nothing

- **WHEN** an operation names a deck beyond the ones the user holds
- **THEN** nothing is created, deleted, or edited

### Requirement: A deck's standing is derived from its contents

Every deck SHALL have a standing that is worked out from the cards it holds and nothing else. The
standing SHALL report each of the deck's problems:

- **Invalid**: the deck breaks the rarity limit.
- **Incomplete**: the deck holds fewer than the full nine cards.

A deck with neither problem SHALL be **Ready**. A deck MAY be Invalid and Incomplete at once, and
then both problems SHALL be reported. Invalid SHALL rank above Incomplete as the more serious
problem.

The standing SHALL NOT be stored: it MUST NOT appear in the persisted user, and it MUST be the same
whenever the same contents are evaluated.

#### Scenario: A full deck within the limit is ready

- **WHEN** a deck holds nine cards, at most one of which has four stars or more
- **THEN** its standing is Ready
- **AND** no problem is reported

#### Scenario: A short deck is incomplete

- **WHEN** a deck holds five cards, none of which has four stars or more
- **THEN** its standing reports Incomplete
- **AND** it reports that four more cards are needed
- **AND** it does not report Invalid

#### Scenario: An empty deck is incomplete

- **WHEN** a deck holds no cards
- **THEN** its standing reports Incomplete, needing nine cards
- **AND** it does not report Invalid

#### Scenario: Both problems are reported together

- **WHEN** a deck holds six cards, two of which have four stars
- **THEN** its standing reports both Invalid and Incomplete
- **AND** Invalid is ranked first

#### Scenario: The standing is not persisted

- **WHEN** a user holding decks of every standing is persisted and read back
- **THEN** the persisted user carries no standing for any deck
- **AND** each deck's standing, worked out again, is unchanged

### Requirement: A deck holds at most one card of four stars or more

A deck SHALL be Invalid when it holds more than one card whose star rating is four or higher.
Repeated copies count: two copies of the same four-star card break the limit. Both the star
threshold (four) and the number of such cards allowed (one) SHALL be stated in exactly one place,
and the standing, its message, and battle eligibility SHALL all derive from that statement.

When the standing reports Invalid, it SHALL say which rule was broken and how many cards over the
limit the deck is, so the player can be told what to remove.

#### Scenario: One high-rarity card is allowed

- **WHEN** a deck holds exactly one card of four stars
- **THEN** it is not Invalid

#### Scenario: Two high-rarity cards break the limit

- **WHEN** a deck holds two different cards of four stars
- **THEN** it is Invalid
- **AND** the standing says the deck holds two cards of four stars or more, where one is allowed

#### Scenario: Two copies of one card break the limit

- **WHEN** a deck holds two copies of the same four-star card
- **THEN** it is Invalid

#### Scenario: Ratings above four count toward the limit

- **WHEN** a deck holds one four-star card and one card rated five or six stars
- **THEN** it is Invalid

#### Scenario: Ratings below four never count

- **WHEN** a deck holds nine cards of three stars or fewer
- **THEN** it is not Invalid

### Requirement: The rarity limit does not refuse an addition

Adding a card that would make a deck Invalid SHALL NOT be refused for that reason. The limit governs
the deck's standing, not what deck editing allows. A deck operation SHALL still be refused only for
the reasons already stated: no such deck, a full deck, an unowned card, more copies of a card than
are held, or a position no card occupies. The player SHALL always be able to make an Invalid deck
valid again by removing cards.

#### Scenario: A second four-star card is accepted

- **WHEN** a four-star card is added to a deck that already holds a different four-star card, and
  the deck has a free position
- **THEN** the addition succeeds
- **AND** the deck's standing becomes Invalid

#### Scenario: Removal restores validity

- **WHEN** one of the two four-star cards is removed from an Invalid deck
- **THEN** the deck is no longer Invalid

### Requirement: Only a ready deck is eligible for battle

A deck SHALL be eligible to be taken into battle only when its standing is Ready. Both an Invalid
deck and an Incomplete deck SHALL be ineligible. Eligibility SHALL be read from the deck's standing,
not decided separately, so that any surface offering a choice of deck for battle withholds exactly
the decks the standing reports a problem for.

#### Scenario: A ready deck is eligible

- **WHEN** a deck's standing is Ready
- **THEN** it is eligible for battle

#### Scenario: An invalid deck is not eligible

- **WHEN** a deck's standing reports Invalid, whether or not it is also Incomplete
- **THEN** it is not eligible for battle

#### Scenario: An incomplete deck is not eligible

- **WHEN** a deck's standing reports Incomplete only
- **THEN** it is not eligible for battle

#### Scenario: A new player has no eligible deck

- **WHEN** a user created with no prior data is read
- **THEN** their one seeded deck is Incomplete
- **AND** they hold no deck eligible for battle

### Requirement: Quantity held limits the copies of a card within each deck

A card's quantity in the collection SHALL bound how many copies of that card a single deck may
hold: a deck SHALL hold no more copies of a card than the collection holds. The bound SHALL apply
to each deck on its own and SHALL NOT be shared between decks, so holding one copy of a card permits
one copy of it in every deck at once. Adding a card to a deck SHALL NOT reduce, reserve, consume, or
otherwise change the collection. An addition that would put more copies of a card in a deck than
the collection holds SHALL be refused.

#### Scenario: One copy permits one per deck

- **WHEN** a player holding exactly one copy of a card adds that card to a deck, and then adds it to
  the same deck again
- **THEN** the first addition succeeds and the second is refused
- **AND** the deck holds one copy of it
- **AND** the collection still reports a quantity of one for that card

#### Scenario: Copies held are copies usable

- **WHEN** a player holding three copies of a card adds it to an empty deck four times
- **THEN** the first three additions succeed and the fourth is refused
- **AND** the deck holds three copies of it

#### Scenario: The same card serves several decks

- **WHEN** a player holding one copy of a card adds it to three different decks
- **THEN** all three decks hold that card
- **AND** no deck's contents or limit are affected by another's

#### Scenario: Removing a copy makes room for it again

- **WHEN** a deck holds every copy of a card the collection holds and one of them is removed
- **THEN** that card can be added to the deck again

#### Scenario: Deck building never spends the collection

- **WHEN** any sequence of additions and removals is applied to any of the user's decks
- **THEN** the collection's quantities and its distinct-card count are unchanged throughout
- **AND** the Geo balance is unchanged throughout

### Requirement: A card must be unlocked before any deck may use it

A card SHALL be placeable in a deck only where the user's collection holds at least one copy of it.
A card the user does not hold SHALL NOT be added to any deck, and the attempt SHALL change nothing.
Unlocking a card is the gate to using it at all. How many copies one deck may use is bounded by the
quantity held.

#### Scenario: An unowned card is refused

- **WHEN** a card the collection reports a quantity of zero for is added to a deck
- **THEN** the addition does not happen
- **AND** the deck is unchanged

#### Scenario: Unlocking opens the card to every deck

- **WHEN** a card the collection holds exactly one copy of is added to a deck
- **THEN** the addition succeeds
- **AND** it succeeds again for the same card and a different deck
