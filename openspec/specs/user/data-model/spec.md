## Purpose

Defines what a Hollow Master user owns — a collection of cards held with quantities and a balance of
Geo — and the rules that govern how either changes, so that every surface that spends, earns, or
grants reads the same player state and no sequence of actions can leave that state impossible.

## Requirements

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

Where a currency, Geo or Rosaries, is spent in exchange for cards, the deduction and the grant
SHALL take effect as a single step. The user MUST NOT be observable in a state where the currency
has been spent but the cards have not been granted, or the reverse.

#### Scenario: A successful purchase settles both sides

- **WHEN** a user affords a purchase of cards
- **THEN** the balance falls by the price and the cards appear in the collection
- **AND** no intermediate state showing one without the other is observable

#### Scenario: A failed purchase settles neither side

- **WHEN** a user cannot afford a purchase of cards
- **THEN** the balance is unchanged and no card is added to the collection

#### Scenario: A Rosary purchase settles both sides

- **WHEN** a user buys a card with Rosaries
- **THEN** the Rosary balance falls by the price and the card's quantity rises by one in the same
  step
- **AND** the Geo balance is unchanged

### Requirement: A user owns a card collection, a Geo balance, and their decks

The application SHALL maintain exactly one user, and that user SHALL carry exactly four things: a
collection of cards, a balance of the currency named Geo, a balance of the currency named Rosaries,
and a list of decks. All four MUST be readable at any time, and none MUST be derived from another.
What a deck is and the rules that bound it are stated by `user/decks`. What this requirement fixes
is that the decks are part of the one user, beside the collection and the two balances. A sale
that trims a deck, as stated in `user/decks`, is the one place the collection's quantities constrain
a deck's contents. That is a bound, not a derivation.

#### Scenario: The user's holdings are readable

- **WHEN** the user is read
- **THEN** their card collection, their Geo balance, their Rosary balance, and their decks are all
  available

#### Scenario: The three are independent

- **WHEN** the user's decks change
- **THEN** neither the collection's quantities nor either balance change as a consequence
- **AND** a change to either balance does not alter the collection or any deck's contents

#### Scenario: The two currencies are independent

- **WHEN** Geo is credited or spent
- **THEN** the Rosary balance is unchanged
- **AND** when Rosaries are credited or spent, the Geo balance is unchanged

#### Scenario: The user requires no identity

- **WHEN** the application starts with no prior user data
- **THEN** a user exists and can be read
- **AND** no sign-in, name, or other identifying detail is required of the player or exposed by the user

#### Scenario: There is exactly one user

- **WHEN** two different surfaces read the user
- **THEN** both read the same collection, the same balances, and the same decks
- **AND** a change made through one surface is visible to the other

### Requirement: The Rosary balance starts at zero and can never go negative

A new user's Rosary balance SHALL be zero. The balance SHALL be a whole number of zero or greater at
all times. No operation MUST be able to leave it negative. Spending Rosaries SHALL succeed only
when the balance is at least the amount being spent. A spend the user cannot afford SHALL change
nothing and SHALL report that it did not happen.

#### Scenario: A new user has no Rosaries

- **WHEN** a user is created with no prior data
- **THEN** their Rosary balance is 0

#### Scenario: A spend of exactly the balance is affordable

- **WHEN** a user with 100 Rosaries buys a card priced at 100
- **THEN** the purchase reports success
- **AND** the Rosary balance is 0

#### Scenario: An unaffordable spend changes nothing

- **WHEN** a user with 99 Rosaries buys a card priced at 100
- **THEN** the purchase reports failure
- **AND** the Rosary balance is still 99
- **AND** the collection is unchanged

#### Scenario: The balance is never negative

- **WHEN** any sequence of purchases and sales is applied to the user
- **THEN** the Rosary balance after every one of them is zero or greater

### Requirement: A card's Rosary prices are derived from its rarity

A card's sale price SHALL be 10 Rosaries per star of its rating. Its purchase price SHALL be 100
Rosaries per star. Both multipliers SHALL be stated in exactly one place, and every surface that
shows or charges a price SHALL derive it from that statement rather than restating it. Prices
SHALL be whole numbers. No card's sale price SHALL be at or above its purchase price.

#### Scenario: Prices follow the star rating

- **WHEN** the prices of a one-star card and of a four-star card are read
- **THEN** the one-star card sells for 10 and costs 100
- **AND** the four-star card sells for 40 and costs 400

#### Scenario: Selling never pays more than buying costs

- **WHEN** any catalogued card's prices are read
- **THEN** its sale price is below its purchase price

### Requirement: Selling a card removes one copy and credits its price in one step

Selling a card SHALL remove exactly one copy of it from the collection, credit exactly its sale
price to the Rosary balance, and trim the user's decks as `user/decks` requires, all as a single
step. The user MUST NOT be observable with the copy gone and the Rosaries not credited, or the
reverse, or with a deck holding more copies than the collection now does. Selling a card the
collection holds no copy of SHALL change nothing and SHALL report that it did not happen. Selling
SHALL NOT change the Geo balance.

#### Scenario: Selling a duplicate

- **WHEN** a user holding three copies of a two-star card sells one
- **THEN** the sale reports success
- **AND** the card's quantity is 2 and the Rosary balance has risen by 20

#### Scenario: Selling the last copy un-owns the card

- **WHEN** a user holding one copy of a card sells it
- **THEN** the card's quantity reads zero
- **AND** the number of distinct cards held falls by one

#### Scenario: Selling a card not held is refused

- **WHEN** a user holding no copy of a card sells it
- **THEN** the sale reports failure
- **AND** the collection, both balances, and every deck are unchanged

#### Scenario: A sale settles every side together

- **WHEN** a sale succeeds
- **THEN** no intermediate state is observable in which only some of the copy's removal, the
  credit, and any deck trimming have taken effect
