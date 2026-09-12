## Purpose

Keeps a user's collection and Geo across page loads, and keeps the rest of the application ignorant
of where that data is kept, so that replacing browser storage with a backend later changes this
capability and nothing else.

## Requirements

### Requirement: The user record outlives a page load

The user's collection and Geo balance SHALL be restored when the application is loaded again on the
same browser. A change to either SHALL be durable without the player taking any explicit save action.

#### Scenario: Holdings survive a reload

- **WHEN** the user's balance and collection are changed, and the page is then reloaded
- **THEN** the restored user has the changed balance and the changed collection

#### Scenario: No explicit save is required

- **WHEN** the user's state changes
- **THEN** it is persisted without the player being asked to save
- **AND** no unsaved-changes state is presented anywhere

#### Scenario: A first visit seeds rather than restores

- **WHEN** the application is loaded on a browser that holds no stored user
- **THEN** a new user is created with the starter collection and zero Geo
- **AND** that new user is persisted, so a further reload restores it rather than reseeding

### Requirement: Storage is reached through a single replaceable boundary

The application SHALL read and write persisted user data through one named storage boundary.
No other part of the application MUST read or write the underlying store directly. Substituting a
different implementation of that boundary SHALL change where data is kept and nothing else about the
application's behaviour.

#### Scenario: A substituted store changes nothing else

- **WHEN** the storage boundary is fulfilled by a different implementation
- **THEN** every behaviour of the user data model and the shop is unchanged

#### Scenario: No direct store access elsewhere

- **WHEN** the application's source is searched for direct use of the underlying store
- **THEN** it appears only in the implementation of the storage boundary

### Requirement: Persisted cards are identified by set and number

The persisted form of a collection SHALL identify each card by its collection identity — its set and
its number within that set — together with the quantity held. It MUST NOT persist a card's name,
artwork, stats, arrows, or ability text.

#### Scenario: A stored collection carries identities and quantities

- **WHEN** a persisted collection is inspected
- **THEN** each entry names a set, a number, and a quantity
- **AND** no other card property appears in it

#### Scenario: A card's properties may change without invalidating saved data

- **WHEN** a catalogued card's stats, artwork, or ability text are edited and the application is reloaded
- **THEN** the restored collection still holds that card at the same quantity

### Requirement: Persisted data carries a schema version

The persisted record SHALL carry a version identifying the shape it was written in. Data written in
a version the application does not recognise MUST NOT be interpreted as though it were current.

#### Scenario: A written record states its version

- **WHEN** the user is persisted
- **THEN** the stored record carries the current schema version

#### Scenario: An unrecognised version is not misread

- **WHEN** stored data carries a version the application does not recognise
- **THEN** it is not interpreted as current data
- **AND** a fresh seeded user is produced instead

### Requirement: Unreadable stored data yields a fresh user rather than a failure

Stored data that is absent, malformed, of an unrecognised version, or structurally invalid SHALL
result in a newly seeded user — the nine starter cards and zero Geo. Loading MUST NOT throw, MUST
NOT leave the application without a user, and MUST NOT present the player with an error state they
cannot act on.

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

### Requirement: Cards no longer in the catalogue are dropped on load

Where persisted data names a card the catalogue no longer contains, that entry SHALL be dropped and
the rest of the collection SHALL be restored. A single unknown card MUST NOT cost the player the
rest of their collection or their Geo.

#### Scenario: An unknown card is dropped and the rest survives

- **WHEN** stored data holds five known cards, one unknown card, and a Geo balance
- **THEN** the restored collection holds the five known cards
- **AND** the balance is restored in full

#### Scenario: An invalid quantity is not restored as owned

- **WHEN** stored data holds an entry with a quantity that is negative, fractional, or not a number
- **THEN** that entry is dropped rather than restored
