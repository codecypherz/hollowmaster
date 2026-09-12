## ADDED Requirements

### Requirement: The Geo amount primitive

The design system SHALL provide a single primitive for displaying an amount of Geo, defined once and
used by every surface that shows Geo. A Geo amount SHALL render as **the amount followed by the Geo
mark** — the numeral first, then the currency's icon — and nothing else.

The word "Geo" MUST NOT be set beside a Geo amount anywhere in the application: the mark names the
currency. No surface MAY declare its own arrangement of amount and mark, its own icon, or its own
spelling of the currency.

#### Scenario: An amount is rendered with its mark

- **WHEN** a surface displays an amount of Geo
- **THEN** the numeral is shown first and the Geo mark immediately after it

#### Scenario: The word is not used beside a number

- **WHEN** any screen showing a Geo amount is rendered
- **THEN** the word "Geo" does not appear next to that amount

#### Scenario: No surface defines its own

- **WHEN** a surface shows Geo
- **THEN** it composes the Geo amount primitive
- **AND** it declares no competing currency treatment of its own

#### Scenario: Zero is an amount like any other

- **WHEN** an amount of zero is displayed
- **THEN** it renders as zero followed by the Geo mark, neither hidden nor blanked

### Requirement: The Geo mark is legible and named

The Geo mark SHALL be sized from the type it sits beside, so it reads as part of the amount at every
type scale the primitive is used at — from a small price to the purse's display numeral — and SHALL
sit on the amount's own baseline rather than floating above or below the numeral.

The mark SHALL carry the currency's name as its accessible name, so that assistive technology
announces an amount as that number of Geo. The mark MUST NOT be announced as an image, a filename, or
left unnamed.

#### Scenario: The mark scales with its amount

- **WHEN** a Geo amount is rendered at a small type size and at a large one
- **THEN** the mark is proportionate to the numeral in both

#### Scenario: The mark is announced as the currency

- **WHEN** a screen reader encounters a Geo amount of 500
- **THEN** it announces five hundred Geo

#### Scenario: The mark reads inside a control

- **WHEN** a Geo amount is used as a button's label
- **THEN** the amount and its mark are legible against the button's field
- **AND** the button's own hover, focus, and disabled treatments are unchanged
