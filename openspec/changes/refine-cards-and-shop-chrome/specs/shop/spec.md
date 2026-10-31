## ADDED Requirements

### Requirement: The Shop page draws no corner frame

The Shop page SHALL NOT draw the design system's corner-frame brackets at its edges or anywhere
else on the page, on the storefront or during a pack opening. The page's atmosphere (the void
background, the mist, and the soul particles) and its ornamental divider SHALL remain.

#### Scenario: No corner brackets on the storefront

- **WHEN** the Shop storefront renders at any supported viewport
- **THEN** no corner-frame bracket is present at any corner of the page

#### Scenario: No corner brackets during an opening

- **WHEN** a pack is being opened or its summary is shown
- **THEN** no corner-frame bracket is present at any corner of the page

#### Scenario: The rest of the theme remains

- **WHEN** the Shop page renders
- **THEN** its void background, mist, soul particles, and ornamental divider are still drawn
