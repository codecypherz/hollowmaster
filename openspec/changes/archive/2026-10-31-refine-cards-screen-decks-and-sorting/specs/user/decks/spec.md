## ADDED Requirements

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

## MODIFIED Requirements

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

## REMOVED Requirements

### Requirement: Quantity held does not limit use in a deck

**Reason**: The quantity held now bounds how many copies of a card one deck may hold. "One copy
fills a whole deck" is no longer true.

**Migration**: Superseded by "Quantity held limits the copies of a card within each deck". The
per-deck bound replaces the unlimited rule, and the guarantee that deck building never spends the
collection is kept.

### Requirement: Only unlocked cards may be placed in a deck

**Reason**: "Unlocking is the only gate" no longer holds now that quantity bounds copies per deck.

**Migration**: Superseded by "A card must be unlocked before any deck may use it", which keeps the
unowned-card refusal.
