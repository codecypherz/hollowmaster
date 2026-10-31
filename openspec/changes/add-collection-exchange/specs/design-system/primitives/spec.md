## ADDED Requirements

### Requirement: The Rosary amount primitive

The design system SHALL provide a single primitive for displaying an amount of Rosaries, defined
once and used by every surface that shows Rosaries. A Rosary amount SHALL render as **the amount
followed by the Rosary mark**, the numeral first and then the currency's icon, and nothing else. The
mark SHALL be the application's Rosary artwork, `rosarie.webp`. The Rosary amount SHALL follow the
same arrangement, sizing, and baseline rules as the Geo amount, so the two currencies read as one
family. Neither primitive SHALL be usable to show the other currency.

The word "Rosaries" MUST NOT be set beside a Rosary amount anywhere in the application: the mark
names the currency. No surface MAY declare its own arrangement of amount and mark, its own icon, or
its own spelling of the currency. A control MAY carry a verb such as `Buy` or `Sell` beside the
amount.

#### Scenario: An amount is rendered with its mark

- **WHEN** a surface displays an amount of Rosaries
- **THEN** the numeral is shown first and the Rosary mark immediately after it

#### Scenario: The word is not used beside a number

- **WHEN** any screen showing a Rosary amount is rendered
- **THEN** the word "Rosaries" does not appear next to that amount

#### Scenario: No surface defines its own

- **WHEN** a surface shows Rosaries
- **THEN** it composes the Rosary amount primitive
- **AND** it declares no competing currency treatment of its own

#### Scenario: Zero is an amount like any other

- **WHEN** an amount of zero Rosaries is displayed
- **THEN** it renders as zero followed by the Rosary mark, neither hidden nor blanked

#### Scenario: The two currencies are told apart

- **WHEN** a Geo amount and a Rosary amount of the same number are shown side by side
- **THEN** each carries its own mark
- **AND** assistive technology announces one as Geo and the other as Rosaries

### Requirement: The Rosary mark is legible and named

The Rosary mark SHALL be sized from the type it sits beside, so it reads as part of the amount at
every type scale the primitive is used at, from a tile's price to the purse. It SHALL sit on the
amount's own baseline. The mark SHALL carry the currency's name as its accessible name, so that
assistive technology announces an amount as that number of Rosaries. The mark MUST NOT be announced
as an image, a filename, or left unnamed.

#### Scenario: The mark scales with its amount

- **WHEN** a Rosary amount is rendered at a small type size and at a large one
- **THEN** the mark is proportionate to the numeral in both

#### Scenario: The mark is announced as the currency

- **WHEN** a screen reader encounters a Rosary amount of 300
- **THEN** it announces three hundred Rosaries

#### Scenario: The mark reads inside a control

- **WHEN** a Rosary amount is used in a button's label, including a disabled one
- **THEN** the amount and its mark are legible against the button's field
- **AND** the button's own hover, focus, and disabled treatments are unchanged
