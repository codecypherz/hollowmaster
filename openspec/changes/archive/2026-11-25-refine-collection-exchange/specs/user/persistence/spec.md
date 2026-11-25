## ADDED Requirements

### Requirement: A restored milestone is never below what is held

The persisted record SHALL carry the user's milestones. On restoring a user, each milestone SHALL be
the higher of what the record states and what the restored balance and collection prove. A record
written before milestones existed SHALL be restored with what its balance and collection prove. A
milestone that is missing from a current record or is not a possible value SHALL cost only itself:
it SHALL be restored as what is proved, and the rest of the record SHALL be restored in full.

#### Scenario: Milestones survive a reload

- **WHEN** a user whose highest balance is 9999 has spent it all, and the page is then reloaded
- **THEN** the restored user's highest balance is 9999 and the rarity 6 rate is known

#### Scenario: A record from before milestones

- **WHEN** stored data written before milestones existed holds 12000 Rosaries and a four-star card
  as its rarest
- **THEN** the restored user's highest balance is 12000 and highest rating is 4

#### Scenario: A milestone below what is held is raised

- **WHEN** a current record states a highest balance of 10 and a balance of 300
- **THEN** the restored user's highest balance is 300

#### Scenario: An impossible milestone costs only itself

- **WHEN** a current record states a highest rating of 9 or a highest balance that is negative,
  fractional, or not a number
- **THEN** that milestone is restored as what the balance and collection prove
- **AND** the collection, both balances, and every deck are restored in full

## MODIFIED Requirements

### Requirement: The user record outlives a page load

The user's collection, Geo balance, Rosary balance, decks, and milestones SHALL be restored when the
application is loaded again on the same browser. A change to any of them SHALL be durable without
the player taking any explicit save action. The cart of pending exchanges is not part of the user:
it SHALL NOT be persisted, and what is pending in it is not an unsaved change to the user.

#### Scenario: Holdings survive a reload

- **WHEN** the user's balance and collection are changed, and the page is then reloaded
- **THEN** the restored user has the changed balance and the changed collection

#### Scenario: Rosaries survive a reload

- **WHEN** the player sells and buys cards for Rosaries, and the page is then reloaded
- **THEN** the restored user has the same Rosary balance, the same collection, and the same decks
  the exchanges left

#### Scenario: Decks survive a reload

- **WHEN** decks are created, filled, or deleted, and the page is then reloaded
- **THEN** the restored user holds the same decks, in the same order, each holding the same cards
  in the same positions

#### Scenario: No explicit save is required

- **WHEN** the user's state changes
- **THEN** it is persisted without the player being asked to save
- **AND** no unsaved-changes state is presented anywhere

#### Scenario: The cart is not persisted

- **WHEN** the player adds cards to the cart without confirming it, and the page is then reloaded
- **THEN** the restored user is exactly as it was before the cards were added to the cart
- **AND** the cart is empty

#### Scenario: A first visit seeds rather than restores

- **WHEN** the application is loaded on a browser that holds no stored user
- **THEN** a new user is created with the starter collection, zero Geo, zero Rosaries, and one
  empty deck
- **AND** that new user is persisted, so a further reload restores it rather than reseeding

### Requirement: Persisted data carries a schema version

The persisted record SHALL carry a version identifying the shape it was written in. Data written in
a version the application does not recognise MUST NOT be interpreted as though it were current.
Where the application recognises an earlier version it SHALL upgrade that record rather than
discard it: an earlier record is a complete user of its own time, and a player MUST NOT lose their
collection or their Geo because the shape around it grew.

#### Scenario: A written record states its version

- **WHEN** the user is persisted
- **THEN** the stored record carries the current schema version

#### Scenario: An unrecognised version is not misread

- **WHEN** stored data carries a version the application does not recognise
- **THEN** it is not interpreted as current data
- **AND** a fresh seeded user is produced instead

#### Scenario: A record written before decks existed is upgraded

- **WHEN** stored data carries the version written before decks were part of the user record
- **THEN** the collection and the Geo balance it holds are restored in full
- **AND** the restored user holds no decks and zero Rosaries
- **AND** the record is rewritten at the current version, so a further reload restores it directly

#### Scenario: A record written before Rosaries existed is upgraded

- **WHEN** stored data carries the version written with decks but before Rosaries were part of the
  user record
- **THEN** the collection, the Geo balance, and every deck it holds are restored in full
- **AND** the restored user holds zero Rosaries
- **AND** the record is rewritten at the current version, so a further reload restores it directly

#### Scenario: An impossible Rosary balance costs the record

- **WHEN** a current-version record holds a Rosary balance that is negative, fractional, or not a
  number
- **THEN** it is treated as unreadable, the same as an impossible Geo balance

#### Scenario: A record written before milestones existed is upgraded

- **WHEN** stored data carries the version written with Rosaries but before milestones were part of
  the user record
- **THEN** the collection, the Geo balance, the Rosary balance, and every deck it holds are restored
  in full
- **AND** the record is rewritten at the current version, so a further reload restores it directly
