## Purpose

Defines the shared visual primitives — the atmospheric background layers, ornamental framing, and interactive controls — that establish the Hollow Knight mood on every full-screen surface, so each screen composes them rather than reimplementing them.

## Requirements

### Requirement: Reusable atmosphere layers

The design system SHALL provide the atmospheric background as reusable primitives — a layered void
background, a drifting mist layer, and rising soul particles — defined once and composable onto any
full-screen surface.

A surface SHALL be able to set the field's density without restating how a particle looks or moves.

#### Scenario: A screen composes the atmosphere

- **WHEN** a full-screen surface applies the atmosphere primitives
- **THEN** it renders the layered void background, the mist layer, and the soul particles
- **AND** it does so without declaring its own copy of their rules

#### Scenario: Atmosphere is consistent across screens

- **WHEN** two different screens each compose the atmosphere primitives
- **THEN** both render the same background treatment, the same mist behavior, and particle fields
  drawn from the same visual vocabulary — the same size range, brightness range, motion character,
  and depth treatment
- **AND** the particular particles differ between the two, since each field is generated

#### Scenario: A screen sets its own density

- **WHEN** a screen calls for a denser or sparser particle field than another
- **THEN** it states only how many particles it wants
- **AND** it does not restate any particle's appearance or motion

#### Scenario: Atmosphere never intercepts input

- **WHEN** a pointer interaction occurs anywhere over the atmosphere layers
- **THEN** the interaction reaches the interactive content above them
- **AND** the atmosphere layers themselves receive no pointer events

#### Scenario: Atmosphere is hidden from assistive technology

- **WHEN** a screen reader traverses a surface composing the atmosphere
- **THEN** the decorative background, mist, and particle elements are not announced

### Requirement: The particle field is varied and non-repeating

The soul particle field SHALL present as drifting air rather than as a mechanism. No structural
regularity may be perceptible in it: particles SHALL NOT be distributed at a uniform horizontal
interval, SHALL NOT share a single vertical path, and SHALL NOT vary their size, brightness, or
speed on a pattern that repeats across the field.

Each particle SHALL vary independently along at least these axes: its horizontal position, its
size, its brightness, its speed, its lateral drift, and its phase.

#### Scenario: No visible grid

- **WHEN** the particle field is observed
- **THEN** the horizontal spacing between particles is irregular
- **AND** no column structure or repeating spacing is perceptible

#### Scenario: No two particles share a path

- **WHEN** two particles are observed crossing the field
- **THEN** their trajectories differ in horizontal position, lateral drift, and speed
- **AND** neither traces the other's path offset in time

#### Scenario: Variation does not repeat

- **WHEN** the sizes and brightnesses of particles are compared across the field
- **THEN** no periodic pattern in those values is perceptible

### Requirement: The particle field reads as depth

The particle field SHALL read as a volume of air rather than as a flat plane. Each particle SHALL
occupy a depth, and that depth SHALL govern its visual and motion properties coherently: a particle
that reads as nearer SHALL be correspondingly larger, brighter, sharper, and faster than one that
reads as farther, and no particle may combine the cues of one depth with the cues of another.

#### Scenario: Near particles read as near

- **WHEN** a particle rendered at the near end of the field is observed
- **THEN** it is larger, brighter, and sharper than particles at the far end
- **AND** it crosses the field more quickly than they do

#### Scenario: Far particles read as far

- **WHEN** a particle rendered at the far end of the field is observed
- **THEN** it is smaller, dimmer, and softer than particles at the near end
- **AND** it crosses the field more slowly than they do

#### Scenario: Depth cues do not contradict

- **WHEN** any single particle is observed
- **THEN** its size, brightness, softness, and speed all correspond to the same depth

### Requirement: The particle field is alive on arrival

The particle field SHALL be fully populated at the moment a surface first paints. A surface SHALL
NOT render with an empty or sparse field that fills in over time.

#### Scenario: First paint

- **WHEN** a surface composing the atmosphere primitives first renders
- **THEN** particles are already distributed across the full height of the surface
- **AND** the field's density at that instant matches its density in steady state

#### Scenario: Arriving from another page

- **WHEN** the user navigates from one surface to another
- **THEN** the destination's particle field is populated as soon as the page is visible
- **AND** no interval passes in which the surface appears airless

### Requirement: The particle field is reproducible

For a given surface, the particle field SHALL be generated deterministically, so that the same
surface produces the same field on every render and the field's properties can be asserted in
tests. Different surfaces MAY produce different fields.

#### Scenario: The same surface renders the same field

- **WHEN** a surface is rendered twice with the same configuration
- **THEN** both renders produce identical particle properties

#### Scenario: Field properties are assertable

- **WHEN** a test inspects a generated particle field
- **THEN** each particle's position, size, brightness, speed, drift, and phase are available as
  discrete values
- **AND** the test can assert their distribution without sampling rendered pixels

### Requirement: Ornamental framing primitives

The design system SHALL provide the ornamental framing as reusable primitives — corner brackets that frame a surface, and a horizontal divider composed of gradient rules, nodes, and a rotated gem — defined once and reused wherever framing is needed.

#### Scenario: Corner frames mark a surface

- **WHEN** a surface applies the corner frame primitive
- **THEN** brackets render inset from all four corners
- **AND** each is oriented to point outward from its own corner

#### Scenario: An ornamental divider separates content

- **WHEN** a surface applies the divider primitive
- **THEN** it renders as gradient rules flanking a centered gem
- **AND** the same divider appearance is produced wherever it is used

#### Scenario: Framing is decorative only

- **WHEN** a screen reader traverses a surface containing ornamental framing
- **THEN** the framing elements are not announced as content

### Requirement: Button primitive with variants

The design system SHALL provide a single button primitive covering the standard gold-bordered treatment and a primary soul-accented variant, with defined resting, hover, and focus appearances. Every button in the application MUST use this primitive.

The primitive SHALL additionally offer size as an axis independent of that treatment: a standard size and a larger size, each combinable with either treatment. A size step SHALL affect only the button's scale — its label size and the space around the label — leaving colour, border, hover, focus, and disabled behaviour identical to the same treatment at the standard size. Each size step SHALL be selectable by name, so a surface that wants a step adopts it rather than restating its metrics.

#### Scenario: Standard button at rest

- **WHEN** a standard button is rendered without interaction
- **THEN** it displays uppercase letter-spaced label text on a transparent field within a gold-dim border

#### Scenario: Hovering a standard button

- **WHEN** a pointer hovers a standard button
- **THEN** its label and border brighten toward gold
- **AND** an outward glow and inner wash appear

#### Scenario: Primary variant is visually distinct

- **WHEN** a primary button is rendered alongside a standard button at the same size step
- **THEN** the primary button is soul-accented rather than gold-accented
- **AND** both share the same dimensions, typography, and transition behavior

#### Scenario: A large button is the same button, scaled

- **WHEN** a large button is rendered alongside a standard-size button of the same treatment
- **THEN** the large button's label is larger and the space around it greater
- **AND** its colour, border, hover, focus, and disabled appearances are unchanged from the standard size

#### Scenario: Size and treatment combine freely

- **WHEN** the large size step is applied to a standard button and to a primary button
- **THEN** each keeps its own treatment's colours and accents
- **AND** both render at the same larger dimensions

#### Scenario: Keyboard focus is visible

- **WHEN** a button receives focus via the keyboard
- **THEN** a focus indicator is visible without relying on pointer hover
- **AND** it is visible at every size step

#### Scenario: No screen defines its own button

- **WHEN** any screen in the application renders a button
- **THEN** it uses the shared button primitive
- **AND** it does not declare a competing button style of its own

#### Scenario: A surface adopts a size step by name

- **WHEN** a surface renders a button at the large size
- **THEN** it selects the primitive's large step
- **AND** it does not restate that step's type size or padding for itself

### Requirement: Motion respects reduced-motion preference

All continuous ambient animation in the primitives — mist drift, particle rise, lateral drift,
twinkle, and pulsing glows — SHALL be suppressed when the user has requested reduced motion.

When particle motion is suppressed, the field SHALL remain visible as a still field distributed
across the surface, retaining its varied positions, sizes, and brightnesses. It SHALL NOT collapse
into a line, a column, a corner, or a uniform arrangement, and it SHALL NOT disappear.

#### Scenario: Reduced motion is requested

- **WHEN** the user's system requests reduced motion
- **THEN** ambient looping animations do not play
- **AND** the affected elements remain visible in a static resting state

#### Scenario: A still particle field keeps its character

- **WHEN** particle motion is suppressed for reduced motion
- **THEN** particles remain distributed across both axes of the surface
- **AND** their varied sizes and brightnesses are preserved
- **AND** none is positioned outside the visible surface

#### Scenario: Reduced motion is not requested

- **WHEN** the user's system expresses no reduced-motion preference
- **THEN** ambient animations play as designed
