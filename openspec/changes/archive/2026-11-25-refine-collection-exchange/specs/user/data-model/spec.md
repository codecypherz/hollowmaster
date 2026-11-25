## ADDED Requirements

### Requirement: The user records milestones that never fall

The user SHALL record two milestones: the highest Rosary balance they have ever held, and the
highest star rating of any card they have ever held. Each SHALL rise, in the same step as the change
that causes it, whenever the balance or the collection passes it, however the change came about.
Neither SHALL ever fall other than by the player's data being replaced. At all times the recorded
balance SHALL be at least the current balance, and the recorded rating SHALL be at least that of
every card held. A balance counts as held once an operation has settled: an amount that only arises
partway through settling an order does not count.

#### Scenario: A new user's milestones

- **WHEN** a user is created with no prior data
- **THEN** the highest balance is 0
- **AND** the highest rating is that of the rarest starter card

#### Scenario: Spending does not lower the highest balance

- **WHEN** a user's balance rises to 600 and they then spend 500
- **THEN** the balance is 100 and the highest balance is 600

#### Scenario: Selling does not lower the highest rating

- **WHEN** a user holding one four-star card, and nothing rarer, sells it
- **THEN** the highest rating is still 4

#### Scenario: Cards from a pack count

- **WHEN** a user whose highest rating is 2 is granted a five-star card by a pack
- **THEN** the highest rating is 5 in the same step as the grant

#### Scenario: Only a settled balance counts

- **WHEN** a user with no Rosaries settles one order whose sales total 600 and whose purchases total
  500
- **THEN** the highest balance is 100

#### Scenario: Replacing the player's data resets them

- **WHEN** the player's data is reset
- **THEN** the milestones are a new user's

### Requirement: The rarity 6 rate is known only once earned

A user SHALL know the rates of rarities 1 to 5 from the start. A user SHALL know the rarity 6 rate,
for selling and for buying alike, once they have ever held a card of rarity 6 or have ever held a
balance of at least 9999 Rosaries. Once known it SHALL stay known, whatever is later sold or spent.
Every surface that shows a rate or a price per copy SHALL ask this one rule, and SHALL NOT show a
rate the user does not know. A card whose rate the user does not know MUST NOT be bought: an order
that buys one SHALL change nothing and SHALL report that it did not happen. Whether the rate is
known SHALL be decided from the user as they were before the order.

#### Scenario: A new user does not know it

- **WHEN** a user with no prior data is read
- **THEN** the rates of rarities 1 to 5 are known and the rarity 6 rate is not

#### Scenario: Earning 9999 reveals it

- **WHEN** a user's balance reaches exactly 9999
- **THEN** the rarity 6 rate is known

#### Scenario: One short does not reveal it

- **WHEN** a user's highest balance is 9998 and they have held nothing above five stars
- **THEN** the rarity 6 rate is not known

#### Scenario: Having had the Rosaries is enough

- **WHEN** a user's balance reaches 9999 and they then spend all of it
- **THEN** the rarity 6 rate is still known

#### Scenario: Acquiring a six-star card reveals it

- **WHEN** a user who has never held 9999 Rosaries is granted a six-star card
- **THEN** the rarity 6 rate is known
- **AND** it is still known after they sell that card

#### Scenario: Buying before it is known is refused

- **WHEN** a user who does not know the rarity 6 rate settles an order whose sales would pay for the
  six-star card it buys
- **THEN** the order reports failure
- **AND** the collection, both balances, and every deck are unchanged

## MODIFIED Requirements

### Requirement: A user owns a card collection, a Geo balance, and their decks

The application SHALL maintain exactly one user, and that user SHALL carry exactly five things: a
collection of cards, a balance of the currency named Geo, a balance of the currency named Rosaries,
a list of decks, and the milestones the user has reached. All five MUST be readable at any time, and
none MUST be derived from another. A milestone is a record of what was once held, so it is bounded
below by what is held now but cannot be worked out from it.
What a deck is and the rules that bound it are stated by `user/decks`. What this requirement fixes
is that the decks are part of the one user, beside the collection and the two balances. A sale
that trims a deck, as stated in `user/decks`, is the one place the collection's quantities constrain
a deck's contents. That is a bound, not a derivation.

#### Scenario: The user's holdings are readable

- **WHEN** the user is read
- **THEN** their card collection, their Geo balance, their Rosary balance, their decks, and their
  milestones are all available

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
- **AND** no sign-in, name, or other identifying detail is required of the player or exposed by the
  user

#### Scenario: There is exactly one user

- **WHEN** two different surfaces read the user
- **THEN** both read the same collection, the same balances, and the same decks
- **AND** a change made through one surface is visible to the other

### Requirement: The Rosary balance starts at zero and can never go negative

A new user's Rosary balance SHALL be zero. The balance SHALL be a whole number of zero or greater at
all times. No operation MUST be able to leave it negative. Spending Rosaries SHALL succeed only
when the balance, together with what the same order's sales credit, is at least the amount being
spent. A spend the user cannot afford SHALL change nothing and SHALL report that it did not happen.

#### Scenario: A new user has no Rosaries

- **WHEN** a user is created with no prior data
- **THEN** their Rosary balance is 0

#### Scenario: A spend of exactly the balance is affordable

- **WHEN** a user with 99 Rosaries buys a four-star card
- **THEN** the purchase reports success
- **AND** the Rosary balance is 0

#### Scenario: An unaffordable spend changes nothing

- **WHEN** a user with 98 Rosaries buys a four-star card
- **THEN** the purchase reports failure
- **AND** the Rosary balance is still 98
- **AND** the collection is unchanged

#### Scenario: Sales in the same order count toward the spend

- **WHEN** a user with 3 Rosaries settles an order that sells a one-star card and buys another
- **THEN** the order reports success
- **AND** the Rosary balance is 0

#### Scenario: The balance is never negative

- **WHEN** any sequence of purchases and sales is applied to the user
- **THEN** the Rosary balance after every one of them is zero or greater

### Requirement: A card's Rosary prices are derived from its rarity

A card's sale price and its purchase price SHALL be the stated rate for its star rating:

| Rating | Sale price | Purchase price |
| ------ | ---------- | -------------- |
| 1      | 1          | 4              |
| 2      | 3          | 12             |
| 3      | 9          | 27             |
| 4      | 33         | 99             |
| 5      | 330        | 660            |
| 6      | 5000       | 9999           |

The rates SHALL be stated in exactly one place, and every surface that shows or charges a price
SHALL derive it from that statement rather than restating it. Every rating a card may have SHALL
have both rates. Rates SHALL be whole numbers. No rating's sale price SHALL be at or above its
purchase price. Changing the rates SHALL NOT change any balance already held.

#### Scenario: Prices follow the star rating

- **WHEN** the prices of a one-star card and of a four-star card are read
- **THEN** the one-star card sells for 1 and costs 4
- **AND** the four-star card sells for 33 and costs 99

#### Scenario: Every rating has its rates

- **WHEN** the rates of ratings 1 to 6 are read
- **THEN** each has exactly the sale price and the purchase price the table states

#### Scenario: What is shown is what is charged

- **WHEN** the player settles a purchase of one copy of a card
- **THEN** the Rosary balance falls by exactly the price shown for that card's rarity

#### Scenario: Selling never pays more than buying costs

- **WHEN** any rating's rates are read
- **THEN** its sale price is below its purchase price

### Requirement: An order of sales and purchases settles as one step

The user SHALL be able to settle an order: any number of cards, each either sold or bought in a
whole-number quantity of at least one, with no card in both directions. Settling SHALL remove the
copies sold, add the copies bought, change the Rosary balance by the total of the sale prices less
the total of the purchase prices, and trim the user's decks as `user/decks` requires, all as a
single step. No intermediate state MUST be observable in which only part of the order has taken
effect. An order that sells more copies of a card than are held, that buys a card whose rarity's
rate the user does not know, or whose net would leave the balance below zero, SHALL change nothing
and SHALL report that it did not happen. Settling SHALL NOT change the Geo balance. The decks an
order's sale of a card would trim SHALL be determinable, for any quantity, before it is settled.

#### Scenario: Selling several copies

- **WHEN** a user holding three copies of a two-star card settles an order selling two
- **THEN** the order reports success
- **AND** the card's quantity is 1 and the Rosary balance has risen by 6

#### Scenario: Selling the last copy un-owns the card

- **WHEN** a user settles an order selling every copy they hold of a card
- **THEN** the card's quantity reads zero
- **AND** the number of distinct cards held falls by one

#### Scenario: Selling more than is held is refused

- **WHEN** a user holding one copy of a card settles an order selling two of it and buying another
  card
- **THEN** the order reports failure
- **AND** the collection, both balances, and every deck are unchanged

#### Scenario: An order is refused as a whole

- **WHEN** a user settles an order whose sales alone could apply but whose net exceeds the balance
- **THEN** the order reports failure
- **AND** nothing is sold and nothing is bought

#### Scenario: A mixed order settles every side together

- **WHEN** an order that sells cards used by a deck and buys others succeeds
- **THEN** no intermediate state is observable in which only some of the removals, the grants, the
  balance change, and the deck trimming have taken effect

#### Scenario: The decks a quantity would trim are known in advance

- **WHEN** the decks that selling two copies of a card would trim are asked for before the sale
- **THEN** exactly the decks that selling two copies then trims are reported
