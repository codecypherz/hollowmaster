## MODIFIED Requirements

### Requirement: A user holds an ordered list of decks, at most nine

The user SHALL hold a list of decks. That list MUST hold no more than nine decks, and MAY hold
none. The limit SHALL be stated in exactly one place, and every rule that depends on it, such as
whether another deck may be created or how many deck buttons the Decks page presents, SHALL derive
from that statement rather than restating it.

#### Scenario: Decks are part of the user

- **WHEN** the user is read
- **THEN** their decks are available alongside their collection and their Geo and Rosary balances

#### Scenario: A tenth deck is refused

- **WHEN** a user holding nine decks creates another
- **THEN** the creation does not happen
- **AND** the user still holds exactly nine decks, unchanged

#### Scenario: A user may hold no decks

- **WHEN** a user deletes the last deck they hold
- **THEN** the user holds zero decks
- **AND** the user record remains valid and readable

## ADDED Requirements

### Requirement: Losing a copy trims every deck that would exceed the quantity held

Where the collection's quantity of a card falls, as it does when a copy is sold, every deck that
then holds more copies of that card than the collection does SHALL lose the excess copies in the
same step. The copies removed SHALL be the ones at the deck's latest positions, so the earliest
copies are kept. The deck's remaining cards SHALL close up so its positions stay contiguous from
the first. No other deck, and no other card in a trimmed deck, SHALL be changed. A deck that holds
no more copies than the new quantity SHALL be left exactly as it was. The decks a fall in quantity
would trim SHALL be determinable before it happens, so a surface can name them in advance.

#### Scenario: Selling the only copy takes it out of every deck

- **WHEN** a user holding one copy of a card used by Deck 1 and Deck 3 sells it
- **THEN** neither Deck 1 nor Deck 3 holds that card
- **AND** each of those decks holds one fewer card, with its other cards in the same relative order
- **AND** Deck 2 is unchanged

#### Scenario: The latest copies are the ones removed

- **WHEN** a user holding two copies of a card, used at the second and fifth positions of one deck,
  sells one
- **THEN** that deck keeps the copy at the second position
- **AND** the cards after the fifth position each move up one place

#### Scenario: A deck within the new quantity is untouched

- **WHEN** a user holding three copies of a card, used twice by one deck, sells one
- **THEN** that deck still holds both copies in the same positions

#### Scenario: The affected decks are known in advance

- **WHEN** the decks a sale would trim are asked for before the sale
- **THEN** exactly the decks the sale then trims are reported

#### Scenario: A trimmed deck's standing follows its contents

- **WHEN** a sale takes a card out of a full deck
- **THEN** that deck's standing reports that it is incomplete
