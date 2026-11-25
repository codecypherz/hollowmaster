## MODIFIED Requirements

### Requirement: Each player is dealt nine cards

At the start of a match each player SHALL hold a hand of nine cards. The player's hand SHALL be the
nine cards of the deck chosen for that battle: hand slot one holds the deck's first card, and so on
in deck order. The opponent's hand SHALL be dealt from the card database. A match SHALL NOT be
started for a deck that is not eligible for battle. A hand slot SHALL keep its position for the
whole match: playing the card in a slot empties that slot rather than shifting the remaining cards.

#### Scenario: Both hands start at nine

- **WHEN** a match begins
- **THEN** the player's hand holds nine cards
- **AND** the opponent's hand holds nine cards

#### Scenario: The player's hand is the chosen deck in order

- **WHEN** a match begins with a Ready deck
- **THEN** the player's nine hand slots hold that deck's nine cards in deck order, duplicates
  included

#### Scenario: The opponent is dealt from the card database

- **WHEN** a match begins
- **THEN** the opponent's hand is drawn from the card database and not from the player's deck

#### Scenario: An ineligible deck starts no match

- **WHEN** a match is asked to begin with a deck that is Invalid or Incomplete
- **THEN** no match is started

#### Scenario: A played card leaves its slot empty

- **WHEN** a player plays the card in a given hand slot
- **THEN** that slot becomes empty
- **AND** every other card in the hand remains in the slot it occupied
