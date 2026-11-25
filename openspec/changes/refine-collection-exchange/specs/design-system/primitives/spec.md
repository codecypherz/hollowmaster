## ADDED Requirements

### Requirement: Segmented control primitive

The design system SHALL provide a segmented control: a row of compact buttons, optionally with one
text field among them, joined into a single bar. Adjacent segments SHALL share one rule between
them, with no gap and no doubled border, and the bar SHALL have one continuous outline. Its buttons
SHALL be the button primitive's compact step, keeping that primitive's hover, focus, and unavailable
behaviour, and the bar SHALL be defined once and composed by every surface that needs it. It SHALL
offer a gold accent and a soul accent, which differ in colour only. A focused segment's indicator
SHALL be visible in full, not clipped by the bar or covered by its neighbours. An unavailable
segment SHALL be distinguishable from an available one by more than hue, while the bar's outline
stays whole. The field SHALL centre its text in tabular figures and SHALL be recognisable as
editable by more than colour.

#### Scenario: Segments are joined

- **WHEN** a segmented control with several segments is rendered
- **THEN** there is no space between its segments and one rule between each pair

#### Scenario: The accents differ only in colour

- **WHEN** a gold and a soul segmented control with the same contents are rendered together
- **THEN** their dimensions and type are identical

#### Scenario: Focus is visible within the bar

- **WHEN** any segment, including the field, receives keyboard focus
- **THEN** its whole focus indicator is visible

#### Scenario: An unavailable segment keeps the bar whole

- **WHEN** one segment of the bar is unavailable
- **THEN** it can be told apart with colour removed
- **AND** the bar's outline is unbroken

#### Scenario: No surface defines its own

- **WHEN** the Collection page's rows and the cart dialog's rows are inspected
- **THEN** both compose the segmented control
- **AND** neither declares joined-segment styling of its own
