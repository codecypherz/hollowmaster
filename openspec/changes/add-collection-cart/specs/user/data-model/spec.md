## MODIFIED Requirements

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

- **WHEN** a user settles an order that buys three copies of a card with Rosaries
- **THEN** the Rosary balance falls by three times its price and the card's quantity rises by three
  in the same step
- **AND** the Geo balance is unchanged

### Requirement: The Rosary balance starts at zero and can never go negative

A new user's Rosary balance SHALL be zero. The balance SHALL be a whole number of zero or greater at
all times. No operation MUST be able to leave it negative. Spending Rosaries SHALL succeed only
when the balance, together with what the same order's sales credit, is at least the amount being
spent. A spend the user cannot afford SHALL change nothing and SHALL report that it did not happen.

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

#### Scenario: Sales in the same order count toward the spend

- **WHEN** a user with 90 Rosaries settles an order that sells a one-star card and buys another
  priced at 100
- **THEN** the order reports success
- **AND** the Rosary balance is 0

#### Scenario: The balance is never negative

- **WHEN** any sequence of purchases and sales is applied to the user
- **THEN** the Rosary balance after every one of them is zero or greater

## ADDED Requirements

### Requirement: An order of sales and purchases settles as one step

The user SHALL be able to settle an order: any number of cards, each either sold or bought in a
whole-number quantity of at least one, with no card in both directions. Settling SHALL remove the
copies sold, add the copies bought, change the Rosary balance by the total of the sale prices less
the total of the purchase prices, and trim the user's decks as `user/decks` requires, all as a
single step. No intermediate state MUST be observable in which only part of the order has taken
effect. An order that sells more copies of a card than are held, or whose net would leave the
balance below zero, SHALL change nothing and SHALL report that it did not happen. Settling SHALL NOT
change the Geo balance. The decks an order's sale of a card would trim SHALL be determinable, for
any quantity, before it is settled.

#### Scenario: Selling several copies

- **WHEN** a user holding three copies of a two-star card settles an order selling two
- **THEN** the order reports success
- **AND** the card's quantity is 1 and the Rosary balance has risen by 40

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

## REMOVED Requirements

### Requirement: Selling a card removes one copy and credits its price in one step

**Reason**: Cards are now sold in quantities, together with purchases, through a confirmed order.
**Migration**: See `An order of sales and purchases settles as one step`. Selling one copy is an
order holding one sale of quantity one.
