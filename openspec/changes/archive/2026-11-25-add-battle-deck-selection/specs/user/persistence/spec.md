## MODIFIED Requirements

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

#### Scenario: A record written before the battle deck was remembered is upgraded

- **WHEN** stored data carries the version written with milestones but before the remembered battle
  deck was part of the user record
- **THEN** the collection, both balances, every deck, and the milestones it holds are restored in
  full
- **AND** the restored user has no remembered battle deck
- **AND** the record is rewritten at the current version, so a further reload restores it directly

## ADDED Requirements

### Requirement: The remembered battle deck is persisted and read defensively

The user's remembered battle deck SHALL be part of the persisted record, stored as the deck's
position or as none. It SHALL survive a page load. A stored value that is not a whole number, or
that names a position no restored deck occupies, SHALL be read as no remembered deck. That costs
only the remembered deck, never the rest of the record. A stored deck that is restored but not
eligible for battle SHALL still be read as remembered, as `user/decks` states.

#### Scenario: The remembered deck survives a reload

- **WHEN** the user remembers Deck 2 and the page is reloaded
- **THEN** the restored user remembers Deck 2

#### Scenario: An impossible stored value is read as none

- **WHEN** a current-version record's remembered battle deck is negative, fractional, or not a
  number
- **THEN** the restored user has no remembered battle deck
- **AND** the collection, balances, decks, and milestones are restored as they would otherwise be

#### Scenario: A stored position beyond the restored decks is read as none

- **WHEN** a record remembers Deck 4 but only three decks are restored
- **THEN** the restored user has no remembered battle deck
