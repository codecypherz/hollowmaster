## MODIFIED Requirements

### Requirement: The user record outlives a page load

The user's collection, Geo balance, Rosary balance, and decks SHALL be restored when the
application is loaded again on the same browser. A change to any of them SHALL be durable without
the player taking any explicit save action.

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

### Requirement: Unreadable stored data yields a fresh user rather than a failure

Stored data that is absent, malformed, of an unrecognised version, or structurally invalid SHALL
result in a newly seeded user: the nine starter cards, zero Geo, zero Rosaries, and one empty deck.
Loading MUST NOT throw, MUST NOT leave the application without a user, and MUST NOT present the
player with an error state they cannot act on.

#### Scenario: Corrupt data is discarded

- **WHEN** the stored record is not valid data of the expected shape
- **THEN** a fresh seeded user is produced
- **AND** the application starts normally

#### Scenario: A store that cannot be written to is survivable

- **WHEN** the underlying store refuses a write, for instance because it is full or unavailable
- **THEN** the application continues with the in-memory user
- **AND** no unhandled failure reaches the player

#### Scenario: Storage that cannot be read at all still yields a user

- **WHEN** the underlying store cannot be read, for instance because it is unavailable in this browser
- **THEN** a fresh seeded user is produced and the application runs against it
