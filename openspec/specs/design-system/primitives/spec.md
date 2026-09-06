## Purpose

Defines the shared visual primitives — the atmospheric background layers, ornamental framing, and interactive controls — that establish the Hollow Knight mood on every full-screen surface, so each screen composes them rather than reimplementing them.

## Requirements

### Requirement: Reusable atmosphere layers

The design system SHALL provide the atmospheric background as reusable primitives — a layered void background, a drifting mist layer, and rising soul particles — defined once and composable onto any full-screen surface.

#### Scenario: A screen composes the atmosphere

- **WHEN** a full-screen surface applies the atmosphere primitives
- **THEN** it renders the layered void background, the mist layer, and the soul particles
- **AND** it does so without declaring its own copy of their rules

#### Scenario: Atmosphere is consistent across screens

- **WHEN** two different screens each compose the atmosphere primitives
- **THEN** both render the same background treatment, mist behavior, and particle appearance

#### Scenario: Atmosphere never intercepts input

- **WHEN** a pointer interaction occurs anywhere over the atmosphere layers
- **THEN** the interaction reaches the interactive content above them
- **AND** the atmosphere layers themselves receive no pointer events

#### Scenario: Atmosphere is hidden from assistive technology

- **WHEN** a screen reader traverses a surface composing the atmosphere primitives
- **THEN** the decorative background, mist, and particle elements are not announced

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

All continuous ambient animation in the primitives — mist drift, particle rise, and pulsing glows — SHALL be suppressed when the user has requested reduced motion.

#### Scenario: Reduced motion is requested

- **WHEN** the user's system requests reduced motion
- **THEN** ambient looping animations do not play
- **AND** the affected elements remain visible in a static resting state

#### Scenario: Reduced motion is not requested

- **WHEN** the user's system expresses no reduced-motion preference
- **THEN** ambient animations play as designed
