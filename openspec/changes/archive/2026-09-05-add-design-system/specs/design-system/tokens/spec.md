## Purpose

Defines the canonical set of design tokens — color, typography, spacing, motion, and elevation — that give every surface in Hollow Master a single, consistent Hollow Knight identity, and establishes them as the only permitted source of themed values.

## ADDED Requirements

### Requirement: Single source of truth for themed values

The application SHALL define every themed color, font family, spacing step, motion duration, and elevation value exactly once, in one canonical token set. No screen or component may declare its own private copy of a token that already exists in that set.

#### Scenario: A token is defined once

- **WHEN** the stylesheets are inspected for the definition of any themed color, font, spacing, motion, or elevation value
- **THEN** exactly one authoritative definition of that value exists
- **AND** no component stylesheet redeclares it with a different value

#### Scenario: Changing a token propagates everywhere

- **WHEN** the value of a token is changed in the canonical token set
- **THEN** every surface that uses that token reflects the new value
- **AND** no surface continues to render the previous value

#### Scenario: No hardcoded themed values in components

- **WHEN** a component stylesheet needs a themed color, font family, or elevation
- **THEN** it references the corresponding token
- **AND** it does not inline a literal hex color, font stack, or shadow that duplicates a token

### Requirement: Tokens available as both custom properties and utilities

Tokens SHALL be consumable in two ways from the same definition: as CSS custom properties for hand-written component CSS, and as utility classes for markup. Both forms MUST resolve to identical values at all times.

#### Scenario: Component CSS consumes a token

- **WHEN** a component stylesheet references a token as a CSS custom property
- **THEN** the declared value is applied

#### Scenario: Markup consumes the same token as a utility

- **WHEN** markup applies the utility class generated from a token
- **THEN** the rendered value is identical to the custom-property form of that same token

#### Scenario: The two forms cannot drift

- **WHEN** a token's value is changed
- **THEN** both its custom-property form and its utility form change together

### Requirement: Reconciled palette

The token set SHALL resolve the palette divergence that currently exists between the home and game screens by adopting a single value per color. Where the two screens disagree, the game screen's brighter, more saturated values are authoritative.

#### Scenario: Home and game render identical palette colors

- **WHEN** the home screen and the game screen each render an element using the same semantic color
- **THEN** both render the same color value

#### Scenario: Home screen adopts the reconciled values

- **WHEN** the home screen renders after the token set is adopted
- **THEN** its soul blue and gold accents match the game screen's values
- **AND** the shift is limited to those reconciled colors, with no other change to the home screen's appearance

### Requirement: Semantic color roles

The token set SHALL express color as named semantic roles rather than raw color names, covering at minimum: the void background field, the soul (player) accent, the gold (ornament and structure) accent, the crimson (opponent) accent, and a text ramp spanning dim to bright.

#### Scenario: Ownership is expressed through semantic roles

- **WHEN** a surface must indicate that something belongs to the player or to the opponent
- **THEN** it uses the soul or crimson semantic role respectively
- **AND** the same role produces the same color on every screen

#### Scenario: Text hierarchy is available

- **WHEN** a surface renders text at differing levels of emphasis
- **THEN** the token set provides distinct dim, muted, and bright text values for that purpose

### Requirement: Typography tokens

The token set SHALL define the three type families of the Hollow Knight identity — a decorative display face for titles, a serif face for UI text, and an italic serif face for flavor text — and the web fonts backing them SHALL be requested exactly once for the whole application.

#### Scenario: Fonts are requested once

- **WHEN** the application loads
- **THEN** the web font stylesheet is requested a single time
- **AND** no component triggers a duplicate request for the same families

#### Scenario: Type roles are distinguishable

- **WHEN** a title, a UI label, and a flavor line are rendered
- **THEN** each uses its designated family from the token set

#### Scenario: Every family has a fallback

- **WHEN** a web font fails to load
- **THEN** text renders in a declared fallback family rather than an unstyled default
