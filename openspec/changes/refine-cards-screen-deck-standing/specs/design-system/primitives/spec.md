## ADDED Requirements

### Requirement: Single-line screen header primitive

The design system SHALL provide a single-line screen header as a reusable primitive, for screens
whose working content needs the height a stacked hero header would take. It SHALL present the
screen's title, set in the display type role with the soul treatment, between two ornamental rules
drawn from the same vocabulary as the ornamental divider: gradient rules ending in a node.

The whole header SHALL occupy exactly one line. It SHALL carry no eyebrow, tagline, or second line
of any kind. Its height SHALL be no greater than one line of its title type plus its own vertical
padding.

When the header heads a screen, its title SHALL be that screen's top-level heading for assistive
technology. A surface that shows the header as an example, such as the style guide, SHALL be able
to set a lower heading level without changing how the header looks. The rules SHALL be decorative
and not announced. The rules SHALL take up the width the title leaves and SHALL shorten
before the title is wrapped, shrunk, or truncated.

#### Scenario: The header is one line

- **WHEN** a screen renders the single-line screen header at any viewport size the application
  supports
- **THEN** the title and both rules sit on one line
- **AND** the header's height does not exceed one line of its title type plus its padding

#### Scenario: Rules give way before the title

- **WHEN** the header is rendered in a narrow container
- **THEN** the rules shorten
- **AND** the title is not wrapped, truncated, or reduced in size

#### Scenario: The title is the screen's heading

- **WHEN** a screen reader traverses a screen using the header
- **THEN** the title is announced as the screen's top-level heading
- **AND** the ornamental rules are not announced

#### Scenario: No screen restates it

- **WHEN** two screens use the single-line screen header
- **THEN** both render the same title type, rules, and spacing
- **AND** neither declares its own copy of those rules
