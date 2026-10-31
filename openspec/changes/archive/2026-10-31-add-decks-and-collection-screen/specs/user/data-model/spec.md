## ADDED Requirements

### Requirement: A user owns a card collection, a Geo balance, and their decks

The application SHALL maintain exactly one user, and that user SHALL carry exactly three things: a
collection of cards, a balance of the currency named Geo, and a list of decks. All three MUST be
readable at any time, and none MUST be derived from another. What a deck is and the rules that
bound it are stated by `user/decks`; what this requirement fixes is that the decks are part of the
one user, beside the collection and the balance.

#### Scenario: The user's holdings are readable

- **WHEN** the user is read
- **THEN** their card collection, their Geo balance, and their decks are all available

#### Scenario: The three are independent

- **WHEN** the user's decks change
- **THEN** neither the collection's quantities nor the Geo balance change as a consequence
- **AND** a change to the collection or the balance does not alter any deck's contents

#### Scenario: The user requires no identity

- **WHEN** the application starts with no prior user data
- **THEN** a user exists and can be read
- **AND** no sign-in, name, or other identifying detail is required of the player or exposed by the user

#### Scenario: There is exactly one user

- **WHEN** two different surfaces read the user
- **THEN** both read the same collection, the same balance, and the same decks
- **AND** a change made through one surface is visible to the other

## REMOVED Requirements

### Requirement: A user owns a card collection and a Geo balance

**Reason**: The requirement fixes the user's contents at "exactly two things: a collection of cards
and a balance of the currency named Geo". This change gives the user a third — their decks — so the
count it states is no longer true, and a requirement that enumerates what a user carries cannot be
left enumerating two of three.

**Migration**: Replaced above by "A user owns a card collection, a Geo balance, and their decks",
which carries every scenario of the removed requirement — readable holdings, no identity, exactly
one user — extended to the decks, plus the independence of the three. Nothing about the collection
multiset, the starter seed, or the Geo invariants is changed by this change; those requirements
stand untouched.
