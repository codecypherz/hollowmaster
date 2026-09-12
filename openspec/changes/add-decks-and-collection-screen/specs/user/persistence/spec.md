## MODIFIED Requirements

### Requirement: The user record outlives a page load

The user's collection, Geo balance, and decks SHALL be restored when the application is loaded
again on the same browser. A change to any of them SHALL be durable without the player taking any
explicit save action.

#### Scenario: Holdings survive a reload

- **WHEN** the user's balance and collection are changed, and the page is then reloaded
- **THEN** the restored user has the changed balance and the changed collection

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
- **THEN** a new user is created with the starter collection, zero Geo, and one empty deck
- **AND** that new user is persisted, so a further reload restores it rather than reseeding

### Requirement: Persisted cards are identified by set and number

The persisted form of a collection SHALL identify each card by its collection identity — its set
and its number within that set — together with the quantity held. The persisted form of a deck
SHALL identify each of its cards the same way, by set and number, in the order the deck holds them.
Neither form MUST persist a card's name, artwork, stats, arrows, or ability text.

#### Scenario: A stored collection carries identities and quantities

- **WHEN** a persisted collection is inspected
- **THEN** each entry names a set, a number, and a quantity
- **AND** no other card property appears in it

#### Scenario: A stored deck carries identities in order

- **WHEN** a persisted deck is inspected
- **THEN** it names its cards by set and number in the order the deck holds them
- **AND** no other card property appears in it

#### Scenario: A card's properties may change without invalidating saved data

- **WHEN** a catalogued card's stats, artwork, or ability text are edited and the application is reloaded
- **THEN** the restored collection still holds that card at the same quantity
- **AND** every deck that held that card still holds it in the same position

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
- **AND** the restored user holds no decks
- **AND** the record is rewritten at the current version, so a further reload restores it directly

### Requirement: Unreadable stored data yields a fresh user rather than a failure

Stored data that is absent, malformed, of an unrecognised version, or structurally invalid SHALL
result in a newly seeded user — the nine starter cards, zero Geo, and one empty deck. Loading MUST
NOT throw, MUST NOT leave the application without a user, and MUST NOT present the player with an
error state they cannot act on.

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
the rest of the collection SHALL be restored. Where a persisted deck names such a card, that
position SHALL be dropped and the rest of the deck SHALL be restored. A single unknown card MUST
NOT cost the player the rest of their collection, the rest of any deck, or their Geo.

#### Scenario: An unknown card is dropped and the rest survives

- **WHEN** stored data holds five known cards, one unknown card, and a Geo balance
- **THEN** the restored collection holds the five known cards
- **AND** the balance is restored in full

#### Scenario: An unknown card in a deck costs only its position

- **WHEN** a stored deck of six cards names one card the catalogue no longer contains
- **THEN** the restored deck holds the other five, in their original relative order
- **AND** every other deck is restored in full

#### Scenario: An invalid quantity is not restored as owned

- **WHEN** stored data holds an entry with a quantity that is negative, fractional, or not a number
- **THEN** that entry is dropped rather than restored

## ADDED Requirements

### Requirement: A restored deck holds only cards the restored collection holds

Every card in a restored deck SHALL be one the restored collection holds at a quantity of at least
one. A deck position naming a card the restored collection does not hold SHALL be dropped, so no
load can produce a user whose deck uses a card they have not unlocked.

#### Scenario: A deck position for an unheld card is dropped

- **WHEN** stored data holds a deck naming a card the stored collection does not hold
- **THEN** that position is dropped from the restored deck
- **AND** the deck's other positions are restored in their original relative order

#### Scenario: Restoring never invents ownership

- **WHEN** any stored record is restored
- **THEN** every card in every restored deck reports a collection quantity of at least one

### Requirement: Stored decks beyond the stated limits are brought within them

A restored user SHALL satisfy the deck limits whatever the stored record says. Decks beyond the
ninth SHALL be dropped, and cards beyond a deck's ninth position SHALL be dropped, rather than
restored as an over-full record the rest of the application would have to defend against.

#### Scenario: A record holding too many decks is trimmed

- **WHEN** stored data holds more than nine decks
- **THEN** the first nine are restored and the remainder are dropped

#### Scenario: An over-full deck is trimmed

- **WHEN** a stored deck holds more than nine cards
- **THEN** the first nine are restored in order and the remainder are dropped

#### Scenario: A malformed deck costs only itself

- **WHEN** a stored record holds one deck that is not a list of card identities at all
- **THEN** that deck is dropped
- **AND** every other deck, the collection, and the balance are restored in full
