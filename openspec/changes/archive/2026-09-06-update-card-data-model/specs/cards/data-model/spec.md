## Purpose

Defines what a Hollow Master card is — the properties every card carries, the values each of those properties may hold, and the identity a card has within a collection set — so that every surface, rule, and future feature reads the same card shape and no card can exist in a half-specified state.

## ADDED Requirements

### Requirement: A card carries a fixed set of properties

Every card SHALL carry exactly these nine properties: a name, its arrow positions, a star rating, an image, an attack value, a defense value, ability text, the set it belongs to, and its number within that set. Every one of them MUST be present on every card; a card MUST NOT rely on any of them being derived, defaulted, or inferred from another.

#### Scenario: A card exposes all nine properties

- **WHEN** any card is read
- **THEN** its name, arrows, star rating, image, attack, defense, ability, set, and number are all available

#### Scenario: No property is derived from another

- **WHEN** a card is defined with a given star rating
- **THEN** its attack, defense, and arrows are exactly the values stated for that card
- **AND** they are not calculated from the star rating or from any other property

#### Scenario: An incompletely defined card is rejected

- **WHEN** a card is defined without one of the nine properties, or with an empty name, image, ability, or set
- **THEN** the definition is rejected as invalid rather than accepted with a substituted value

### Requirement: Arrow positions are a duplicate-free subset of the eight compass directions

A card's arrow positions SHALL be drawn from exactly eight directions — north, north-east, east, south-east, south, south-west, west, and north-west. A card MAY possess any number of them from none to all eight, and MUST NOT list the same direction more than once.

#### Scenario: A card possesses a subset of directions

- **WHEN** a card is defined with arrows in some of the eight directions
- **THEN** exactly those directions are reported as possessed
- **AND** the remaining directions are reported as not possessed

#### Scenario: A card possesses every direction

- **WHEN** a card is defined with all eight directions
- **THEN** all eight are reported as possessed

#### Scenario: A repeated direction is rejected

- **WHEN** a card is defined listing the same direction twice
- **THEN** the definition is rejected as invalid

#### Scenario: A direction outside the eight is rejected

- **WHEN** a card is defined with a direction that is not one of the eight compass directions
- **THEN** the definition is rejected as invalid

### Requirement: Star rating is a whole number from 1 to 6

A card's star rating SHALL be a whole number in the inclusive range 1 to 6. Values below 1, above 6, or fractional MUST be rejected.

#### Scenario: Ratings at the range boundaries are accepted

- **WHEN** a card is defined with a star rating of 1, or with a star rating of 6
- **THEN** the definition is accepted and reports that rating

#### Scenario: A rating outside the range is rejected

- **WHEN** a card is defined with a star rating of 0, of 7, or of a fractional value
- **THEN** the definition is rejected as invalid

#### Scenario: Consumers may rely on the bound

- **WHEN** any surface reads a card's star rating
- **THEN** the value is guaranteed to lie between 1 and 6 without that surface clamping it

### Requirement: Attack and defense are whole numbers from 1 to 100

A card's attack and defense SHALL each be a whole number in the inclusive range 1 to 100, stated independently of one another and of the star rating. Values outside that range or fractional values MUST be rejected.

#### Scenario: Values at the range boundaries are accepted

- **WHEN** a card is defined with an attack of 1 and a defense of 100
- **THEN** the definition is accepted and reports those values

#### Scenario: A value outside the range is rejected

- **WHEN** a card is defined with an attack or defense of 0, of 101, or of a fractional value
- **THEN** the definition is rejected as invalid

#### Scenario: Attack and defense are independent

- **WHEN** two cards share the same star rating but state different attack and defense values
- **THEN** each card reports its own stated values

### Requirement: A card carries unnamed ability text

Every card SHALL carry ability text describing what the card does. The ability SHALL have no name of its own — the text is the entirety of the ability. The text MUST be non-empty.

#### Scenario: Ability text is available on every card

- **WHEN** any card is read
- **THEN** non-empty ability text is available for it

#### Scenario: The ability has no separate name

- **WHEN** a card's ability is read
- **THEN** the text is the whole of the ability
- **AND** no separate ability name is exposed

#### Scenario: Empty ability text is rejected

- **WHEN** a card is defined with ability text that is empty or only whitespace
- **THEN** the definition is rejected as invalid

### Requirement: A card is identified by its set and its number within that set

Every card SHALL name the collection set it belongs to and its number within that set. The number SHALL be a whole number of 1 or greater. Together the set and the number MUST identify the card uniquely: no two cards in the catalogue may share both.

#### Scenario: A card reports its collection identity

- **WHEN** any card is read
- **THEN** the set it belongs to and its number within that set are both available

#### Scenario: The same number may recur across different sets

- **WHEN** two cards in different sets both carry number 4
- **THEN** both definitions are valid

#### Scenario: A duplicate number within one set is rejected

- **WHEN** two cards in the same set carry the same number
- **THEN** the catalogue is reported as invalid

#### Scenario: A non-positive number is rejected

- **WHEN** a card is defined with a set number of 0, of a negative value, or of a fractional value
- **THEN** the definition is rejected as invalid

### Requirement: The card catalogue conforms to the model

The application SHALL provide a catalogue of all defined cards, and every card in it MUST satisfy every constraint of this capability. The catalogue MUST NOT contain a card that would be rejected on its own.

#### Scenario: Every catalogued card is valid

- **WHEN** the catalogue is read
- **THEN** every card in it satisfies the property, range, arrow, ability, and set-identity constraints

#### Scenario: Catalogue entries are individually addressable

- **WHEN** a card is drawn from the catalogue
- **THEN** it carries the full card shape and is usable anywhere a card is expected
