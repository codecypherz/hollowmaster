## MODIFIED Requirements

### Requirement: A restored deck holds only cards the restored collection holds

Every card in a restored deck SHALL be one the restored collection holds at a quantity of at least
one, and no restored deck SHALL hold more copies of a card than the restored collection holds. A
deck position naming a card the restored collection does not hold SHALL be dropped. Where a stored
deck holds more copies of a card than the collection, the earliest copies up to the quantity held
SHALL be kept and the later ones dropped. No load can then produce a user whose deck uses a card
they have not unlocked, or more copies than they hold.

#### Scenario: A deck position for an unheld card is dropped

- **WHEN** stored data holds a deck naming a card the stored collection does not hold
- **THEN** that position is dropped from the restored deck
- **AND** the deck's other positions are restored in their original relative order

#### Scenario: Copies beyond the quantity held are dropped

- **WHEN** stored data holds a deck with four copies of a card the stored collection holds two of
- **THEN** the restored deck holds the first two of those copies
- **AND** the deck's other positions are restored in their original relative order

#### Scenario: The copy trim is per deck

- **WHEN** stored data holds two decks each with one copy of a card the collection holds once
- **THEN** both restored decks keep their copy

#### Scenario: Restoring never invents ownership

- **WHEN** any stored record is restored
- **THEN** every card in every restored deck reports a collection quantity of at least the number of
  copies that deck holds
