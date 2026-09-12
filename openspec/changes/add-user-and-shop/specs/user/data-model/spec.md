## Purpose

Defines what a Hollow Master user owns — a collection of cards held with quantities and a balance of
Geo — and the rules that govern how either changes, so that every surface that spends, earns, or
grants reads the same player state and no sequence of actions can leave that state impossible.

## ADDED Requirements

### Requirement: A user owns a card collection and a Geo balance

The application SHALL maintain exactly one user, and that user SHALL carry exactly two things: a
collection of cards and a balance of the currency named Geo. Both MUST be readable at any time, and
neither MUST be derived from the other.

#### Scenario: The user's holdings are readable

- **WHEN** the user is read
- **THEN** their card collection and their Geo balance are both available

#### Scenario: The user requires no identity

- **WHEN** the application starts with no prior user data
- **THEN** a user exists and can be read
- **AND** no sign-in, name, or other identifying detail is required of the player or exposed by the user

#### Scenario: There is exactly one user

- **WHEN** two different surfaces read the user
- **THEN** both read the same collection and the same balance
- **AND** a change made through one surface is visible to the other

### Requirement: The collection records a quantity for every card owned

The card collection SHALL record, for each card the user owns, how many copies of that card they
hold. A card the user does not own SHALL report a quantity of zero rather than being absent in a way
a reader must special-case. Quantities MUST be whole numbers of zero or greater.

#### Scenario: A duplicate card increases its quantity

- **WHEN** a card the user already holds one copy of is added to the collection
- **THEN** that card's quantity becomes 2
- **AND** the number of distinct cards in the collection is unchanged

#### Scenario: An unowned card reports zero

- **WHEN** the quantity of a card the user has never owned is read
- **THEN** zero is reported

#### Scenario: Cards are counted by their catalogue identity

- **WHEN** two copies of the card with the same set and number are added
- **THEN** they are counted as two copies of one card, not as two distinct cards

#### Scenario: Total and distinct counts are both available

- **WHEN** the user holds three copies of one card and one copy of another
- **THEN** the collection reports 2 distinct cards and 4 cards in total

### Requirement: A new user's collection is seeded with nine starter cards

A user created with no prior data SHALL start with a stated set of exactly nine starter cards, one
copy of each. The starter set SHALL be declared explicitly as part of the application's data rather
than selected at random or computed from a rule at run time, so that every new user receives the
same nine cards.

#### Scenario: A new user holds the nine starter cards

- **WHEN** a user is created with no prior data
- **THEN** their collection holds exactly nine cards in total
- **AND** those are the nine stated starter cards, one copy each

#### Scenario: The starter set is the same every time

- **WHEN** two users are created with no prior data
- **THEN** both collections hold the same nine cards

#### Scenario: Every starter card exists in the catalogue

- **WHEN** the starter set is read
- **THEN** every card in it is a card in the catalogue

### Requirement: The Geo balance starts at zero and can never go negative

A new user's Geo balance SHALL be zero. The balance SHALL be a whole number of zero or greater at
all times; no operation MUST be able to leave it negative.

#### Scenario: A new user has no Geo

- **WHEN** a user is created with no prior data
- **THEN** their Geo balance is 0

#### Scenario: Crediting Geo raises the balance

- **WHEN** an amount of Geo is credited to the user
- **THEN** the balance rises by exactly that amount

#### Scenario: The balance is never negative

- **WHEN** any sequence of credits and spends is applied to the user
- **THEN** the balance after every one of them is zero or greater

### Requirement: Spending Geo is all-or-nothing

Spending Geo SHALL succeed only when the balance is at least the amount being spent. A spend the
user cannot afford SHALL change nothing — neither the balance nor the collection — and SHALL report
that it did not happen. A spend that succeeds SHALL reduce the balance by exactly the amount spent.

#### Scenario: An affordable spend is applied

- **WHEN** a user with 250 Geo spends 100
- **THEN** the spend reports success
- **AND** the balance is 150

#### Scenario: A spend of exactly the balance is affordable

- **WHEN** a user with 100 Geo spends 100
- **THEN** the spend reports success
- **AND** the balance is 0

#### Scenario: An unaffordable spend changes nothing

- **WHEN** a user with 99 Geo spends 100
- **THEN** the spend reports failure
- **AND** the balance is still 99
- **AND** the collection is unchanged

### Requirement: A purchase spends and grants together

Where Geo is spent in exchange for cards, the deduction and the grant SHALL take effect as a single
step. The user MUST NOT be observable in a state where the Geo has been spent but the cards have not
been granted, or the reverse.

#### Scenario: A successful purchase settles both sides

- **WHEN** a user affords a purchase of cards
- **THEN** the balance falls by the price and the cards appear in the collection
- **AND** no intermediate state showing one without the other is observable

#### Scenario: A failed purchase settles neither side

- **WHEN** a user cannot afford a purchase of cards
- **THEN** the balance is unchanged and no card is added to the collection
