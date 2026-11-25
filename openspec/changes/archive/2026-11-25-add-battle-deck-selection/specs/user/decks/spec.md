## ADDED Requirements

### Requirement: The user remembers the deck last chosen for battle

The user SHALL record which of their decks they last chose for battle, or that they have chosen
none. A new user SHALL have chosen none. Choosing a deck for battle SHALL be refused, changing
nothing, for an index no deck occupies or for a deck that is not eligible for battle.

Because decks are named by position, the record SHALL name a position and SHALL be kept pointing at
the same deck as the list changes:

- Deleting a deck before the remembered one SHALL move the record down by one, so it still names
  the same deck under its new name.
- Deleting the remembered deck itself SHALL clear the record.
- Deleting a deck after it, creating a deck, or editing any deck's contents SHALL leave the record
  unchanged.

The record SHALL NOT be cleared when the remembered deck stops being eligible, for example through
an edit or a sale that trims it. It only stops being used as a default, as stated by
`deck-selection`, until the deck is eligible again.

#### Scenario: A new user has chosen none

- **WHEN** a user created with no prior data is read
- **THEN** they have no remembered battle deck

#### Scenario: Choosing a ready deck records it

- **WHEN** the user chooses a Ready Deck 2 for battle
- **THEN** Deck 2 is their remembered battle deck

#### Scenario: Choosing an ineligible deck is refused

- **WHEN** the user chooses an Incomplete deck for battle
- **THEN** the choice is refused and the remembered battle deck is unchanged

#### Scenario: Deleting an earlier deck follows the remembered one

- **WHEN** Deck 3 is remembered and Deck 1 is deleted
- **THEN** the remembered battle deck is the deck now named Deck 2, which holds the same cards

#### Scenario: Deleting the remembered deck clears the record

- **WHEN** Deck 2 is remembered and Deck 2 is deleted
- **THEN** the user has no remembered battle deck

#### Scenario: Editing a remembered deck keeps the record

- **WHEN** a card is removed from the remembered deck, leaving it Incomplete
- **THEN** it is still the remembered battle deck
