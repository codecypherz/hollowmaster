## ADDED Requirements

### Requirement: The ground sits in a lit range

The token set's ground values — the void field, the deep field, the nebula and mist layers, and the
panel and cell surfaces — SHALL sit in a cool, desaturated blue-grey range that is perceptibly
lighter than black. No ground token may render as effectively black.

The ground SHALL nonetheless remain dark enough that the soul, gold, and crimson accents read as
light sources against it rather than as flat fills, and the layered ordering SHALL be preserved:
the void is the darkest ground, and each atmospheric and surface layer above it is no darker than
the one beneath.

#### Scenario: The ground is not black

- **WHEN** any ground token is inspected
- **THEN** its value is perceptibly lighter than black
- **AND** its hue lies in the cool blue-grey family rather than being neutral or warm

#### Scenario: Accents still read as light

- **WHEN** a soul, gold, or crimson accent is rendered against the ground
- **THEN** it reads as a light source against a darker field
- **AND** its glow remains visible as a distinct halo

#### Scenario: Layer ordering is preserved

- **WHEN** the ground tokens are compared against one another
- **THEN** the void field is the darkest
- **AND** each atmospheric and surface layer above it is no darker than the layer beneath it

### Requirement: Legibility survives a palette shift

Every text value in the ramp SHALL remain legible against the ground it is used on. When ground or
text values change, the resulting contrast SHALL be no worse than before the change, and body text
SHALL meet the WCAG AA contrast ratio against the ground it renders on.

#### Scenario: Body text meets the contrast floor

- **WHEN** text from the ramp is rendered on the ground it is designed for
- **THEN** the contrast ratio meets the WCAG AA threshold for its size

#### Scenario: A brightening pass does not cost contrast

- **WHEN** the ground values are lightened
- **THEN** the text ramp is adjusted so that every text-on-ground pairing's contrast is preserved
  or improved
- **AND** no pairing that previously met its threshold now falls below it

#### Scenario: The ramp keeps three distinguishable steps

- **WHEN** dim, muted, and bright text are rendered side by side
- **THEN** each is visually distinguishable from the other two

### Requirement: Entrance pace is expressed as tokens

The motion token set SHALL express the pace of a screen's entrance choreography as tokens — the
duration of a single element's entrance, and the interval between successive elements in a
staggered sequence — so that a screen's choreography declares its position in the sequence rather
than a literal time.

#### Scenario: Adjusting the pace of an entrance

- **WHEN** the entrance duration or stagger interval token is changed
- **THEN** every screen and element using it shifts pace together
- **AND** no element's timing has to be edited individually

#### Scenario: An element declares its position, not its time

- **WHEN** an element participates in a staggered entrance
- **THEN** it identifies its position in the sequence
- **AND** its delay is derived from that position and the stagger token rather than stated as a
  literal duration

## MODIFIED Requirements

### Requirement: Semantic color roles

The token set SHALL express color as named semantic roles rather than raw color names, covering at
minimum: the void background field, the soul (player) accent, the gold (ornament and structure)
accent, the crimson (opponent) accent, a text ramp spanning dim to bright, and a scrim — the
translucent near-ground wash laid over artwork and behind overlaid content to hold text legible.

The scrim SHALL be derived from the ground rather than stated independently, so that a change to
the ground carries the scrim with it and no surface is left washing with a stale copy of a former
ground value.

#### Scenario: Ownership is expressed through semantic roles

- **WHEN** a surface must indicate that something belongs to the player or to the opponent
- **THEN** it uses the soul or crimson semantic role respectively
- **AND** the same role produces the same color on every screen

#### Scenario: Text hierarchy is available

- **WHEN** a surface renders text at differing levels of emphasis
- **THEN** the token set provides distinct dim, muted, and bright text values for that purpose

#### Scenario: A surface darkens a band behind text

- **WHEN** a surface needs to hold text legible over artwork or over the atmosphere
- **THEN** it uses the scrim role
- **AND** it does not inline its own near-ground translucent color

#### Scenario: The scrim tracks the ground

- **WHEN** the ground value changes
- **THEN** every surface using the scrim renders a wash consistent with the new ground
- **AND** no surface continues to render a wash matching the previous ground
