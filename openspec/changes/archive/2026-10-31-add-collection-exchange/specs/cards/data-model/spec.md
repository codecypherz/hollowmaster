## ADDED Requirements

### Requirement: Every card belongs to a named set

The application SHALL state the card sets it knows in one ordered list. Each entry SHALL pair the
set identity a card carries with a display name: `FC` is Forgotten Crossroads, `GP` is Greenpath,
and `CT` is City of Tears, in that order. Every catalogued card's set MUST be one of the named sets.
A card naming a set that is not in the list SHALL make the catalogue invalid. A named set MAY hold
no catalogued cards yet. Set identities and display names SHALL each be unique within the list.
The set identity on a card is unchanged by this requirement: the card face still prints the
identity, not the display name.

#### Scenario: A card's set has a display name

- **WHEN** the display name of the set of a card in `FC` is read
- **THEN** it is `Forgotten Crossroads`

#### Scenario: The named sets are ordered

- **WHEN** the named sets are read
- **THEN** they are Forgotten Crossroads, Greenpath, and City of Tears, in that order

#### Scenario: A card in an unnamed set is rejected

- **WHEN** the catalogue holds a card whose set is not a named set
- **THEN** the catalogue is reported as invalid

#### Scenario: A named set may be empty

- **WHEN** a named set holds no catalogued cards
- **THEN** the catalogue is still valid
