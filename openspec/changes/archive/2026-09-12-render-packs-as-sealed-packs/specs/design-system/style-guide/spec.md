## MODIFIED Requirements

### Requirement: Primitive coverage

The style guide SHALL render every shared primitive, including each button variant in its resting, hover, focus, and disabled appearances, the ornamental divider, the corner framing, the atmosphere layers, and the Geo amount.

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

## ADDED Requirements

### Requirement: Sealed pack coverage

The style guide SHALL render the pack component in both states it supports — sealed and torn — so
that the wrapper's craft is reviewable without buying a pack. It SHALL additionally demonstrate the
pack at its minimum supported width, so that the legibility promised there can be judged directly.

#### Scenario: Both pack states are displayed

- **WHEN** the style guide renders the pack section
- **THEN** a sealed pack and a torn pack each appear as a labelled example

#### Scenario: Pack craft is verifiable on the page

- **WHEN** a reviewer inspects the pack section
- **THEN** the crimped top and bottom edges, the edge trim, the foil sheen, the centred artwork, and the tier name printed across the top of the face are all directly observable

#### Scenario: The minimum supported width is inspectable

- **WHEN** the style guide renders the pack section
- **THEN** an example at the pack's minimum supported width is shown
- **AND** no example is narrower than that minimum

#### Scenario: Every tier's wrapper is shown

- **WHEN** the style guide renders the pack section
- **THEN** each pack tier the catalogue offers appears with its own printed name
