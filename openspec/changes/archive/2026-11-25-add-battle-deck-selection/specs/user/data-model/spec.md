## MODIFIED Requirements

### Requirement: A user owns a card collection, a Geo balance, and their decks

The application SHALL maintain exactly one user, and that user SHALL carry exactly six things: a
collection of cards, a balance of the currency named Geo, a balance of the currency named Rosaries,
a list of decks, the deck last chosen for battle, and the milestones the user has reached. All six
MUST be readable at any time, and none MUST be derived from another. A milestone is a record of what
was once held, so it is bounded below by what is held now but cannot be worked out from it.
What a deck is and the rules that bound it are stated by `user/decks`. That spec also states how the
remembered battle deck names a deck and is kept consistent as decks are deleted. What this
requirement fixes is that the decks and the remembered battle deck are part of the one user, beside
the collection and the two balances. A sale that trims a deck, as stated in `user/decks`, is the one
place the collection's quantities constrain a deck's contents. That is a bound, not a derivation.

#### Scenario: The user's holdings are readable

- **WHEN** the user is read
- **THEN** their card collection, their Geo balance, their Rosary balance, their decks, their
  remembered battle deck, and their milestones are all available

#### Scenario: The three are independent

- **WHEN** the user's decks change
- **THEN** neither the collection's quantities nor either balance change as a consequence
- **AND** a change to either balance does not alter the collection or any deck's contents

#### Scenario: Choosing a battle deck changes nothing else

- **WHEN** the user's remembered battle deck changes
- **THEN** no deck's contents, the collection, and neither balance change as a consequence

#### Scenario: The two currencies are independent

- **WHEN** Geo is credited or spent
- **THEN** the Rosary balance is unchanged
- **AND** when Rosaries are credited or spent, the Geo balance is unchanged

#### Scenario: The user requires no identity

- **WHEN** the application starts with no prior user data
- **THEN** a user exists and can be read
- **AND** no sign-in, name, or other identifying detail is required of the player or exposed by the
  user

#### Scenario: There is exactly one user

- **WHEN** two different surfaces read the user
- **THEN** both read the same collection, the same balances, the same decks, and the same
  remembered battle deck
- **AND** a change made through one surface is visible to the other
