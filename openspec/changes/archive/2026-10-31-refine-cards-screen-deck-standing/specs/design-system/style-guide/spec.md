## MODIFIED Requirements

### Requirement: Primitive coverage

The style guide SHALL render every shared primitive, including:

- each button variant in its resting, hover, focus, and disabled appearances
- the ornamental divider
- the corner framing
- the atmosphere layers
- the Geo amount
- the single-line screen header

#### Scenario: Button variants and states are shown

- **WHEN** the style guide renders the button section
- **THEN** each variant is shown
- **AND** its resting, hover, focus, and disabled appearances are each visible for comparison

#### Scenario: Ornaments are shown

- **WHEN** the style guide renders the ornament section
- **THEN** the divider and corner framing primitives are displayed

#### Scenario: The Geo amount is shown

- **WHEN** the style guide renders the Geo amount
- **THEN** amounts spanning the range the application shows — including zero — appear as amount followed by the Geo mark
- **AND** the same primitive is shown at the type sizes it is used at, including inside a button

#### Scenario: The single-line screen header is shown

- **WHEN** the style guide renders the header section
- **THEN** the single-line screen header appears as a labelled example with a sample title
- **AND** it is also shown in a narrow container, so a reviewer can see the rules shorten while the
  title stays on one line, unwrapped and at full size

#### Scenario: The header example does not compete with the page's own heading

- **WHEN** the style guide renders the single-line screen header example
- **THEN** the example does not replace or duplicate the style guide's own top-level heading for
  assistive technology
