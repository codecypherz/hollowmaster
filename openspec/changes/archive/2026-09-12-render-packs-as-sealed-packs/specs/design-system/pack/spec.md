## Purpose

Defines the sealed pack as a rendered object — its aspect, its wrapper craft, the tier name printed
on its face, its minimum supported width, and the torn state an opening leaves it in — so that every
surface showing a pack shows the same physical thing rather than a poster of one.

## ADDED Requirements

### Requirement: Single pack renderer

One pack renderer SHALL draw every sealed pack the application shows — on the storefront and in the
opening alike. A surface SHALL supply the pack's tier and receive that rendering; it MUST NOT draw a
wrapper, a crimp, a sheen, or a printed name of its own.

#### Scenario: Every surface uses the renderer

- **WHEN** any surface displays a pack
- **THEN** it renders it through the shared pack renderer
- **AND** it declares no wrapper treatment of its own

#### Scenario: The same tier looks the same everywhere

- **WHEN** the same tier is shown on the storefront and in the opening
- **THEN** both are the same object: the same wrapper, the same artwork, and the same printed name

### Requirement: The pack renders as a sealed foil wrapper

A pack SHALL read as a sealed wrapper holding cards, not as a framed print. Its face SHALL carry, as
one layered object: a crimped seal along the top edge and along the bottom edge, the pack's artwork
filling the face between them, a foil sheen across that face, and a metallic trim that binds the
wrapper's edge. No part of this treatment MAY depend on artwork the pack cannot supply.

#### Scenario: A pack reads as sealed

- **WHEN** a pack is rendered
- **THEN** its crimped top edge, its crimped bottom edge, its face, and its edge trim are each
  distinguishable
- **AND** it reads as an object with depth rather than as a flat rectangle

#### Scenario: The artwork is inside the wrapper

- **WHEN** a pack's artwork is displayed
- **THEN** the artwork is seated within the wrapper's face, bounded by the crimped edges and the trim
- **AND** it does not extend past the wrapper's edge

#### Scenario: The wrapper survives a missing image

- **WHEN** a pack's artwork fails to load
- **THEN** the wrapper still renders with its crimped edges, trim, sheen, and printed name

### Requirement: The pack fills its face with the artwork, centred

A pack's artwork SHALL fill the whole of the wrapper's face, cropped equally from both sides of
whichever axis is long, so that the centre of the artwork is always the centre of the face. The
artwork MUST NOT be letterboxed, and MUST NOT be distorted to fit.

#### Scenario: The face is fully covered

- **WHEN** a pack is rendered at any supported size
- **THEN** the artwork covers the wrapper's face with no empty band on any side

#### Scenario: The crop is centred

- **WHEN** artwork whose proportions differ from the face is displayed
- **THEN** the amount cropped from one side equals the amount cropped from the other

#### Scenario: Proportions are preserved

- **WHEN** a pack is rendered
- **THEN** the artwork's own proportions are unchanged by the fit

### Requirement: Pack aspect ratio

Every pack SHALL render at a 2.5 : 4 aspect ratio — taller in proportion than the 2.5 : 3.5 card it
holds, so that a pack is never mistaken for a card. This ratio MUST hold at every size a pack is
rendered at, and in its sealed and torn states alike.

#### Scenario: The ratio holds at every size

- **WHEN** a pack is rendered at any supported size
- **THEN** its height is 1.6 times its width

#### Scenario: A pack is not a card

- **WHEN** a pack and a card are rendered side by side at the same width
- **THEN** the pack is visibly the taller of the two

#### Scenario: Tearing does not change the ratio

- **WHEN** a pack is shown torn open
- **THEN** it occupies the same 2.5 : 4 extent it occupied sealed

### Requirement: The tier name is printed on the wrapper

A pack's tier name SHALL be printed on the wrapper itself — within its face, across the top, over the
artwork — the way a real pack prints its set name. The name MUST NOT be set outside the wrapper, and
a surface MUST NOT caption a pack with a name of its own.

The printed name SHALL remain legible over any artwork the pack may carry: its legibility MUST come
from the wrapper's own treatment rather than from the artwork happening to be dark behind it.

#### Scenario: The name is on the pack

- **WHEN** a pack is rendered
- **THEN** its tier name appears within the wrapper, across the top of the face, over the artwork
- **AND** no name is drawn above, below, or beside the wrapper

#### Scenario: The name reads over bright artwork

- **WHEN** a pack whose artwork is bright behind the name is rendered
- **THEN** the name is still legible against it

#### Scenario: The name is real text

- **WHEN** a screen reader traverses a pack
- **THEN** the pack's tier name is announced as text

### Requirement: The wrapper carries the name and nothing else

The wrapper SHALL print the pack's tier name and MUST NOT print how many cards the pack holds, the
probability of any rarity, its price, or any other explanatory copy. What distinguishes one pack from
another on its face is its artwork and its name.

#### Scenario: No contents copy on the wrapper

- **WHEN** a pack is rendered
- **THEN** no card count and no rarity odds appear anywhere on it

#### Scenario: The price is not on the wrapper

- **WHEN** a pack is rendered
- **THEN** its price is not printed on the wrapper

### Requirement: The pack declares a minimum supported width

The pack renderer SHALL declare a minimum supported width of 120 CSS pixels — the card's minimum, for
the object that holds cards — at and above which its crimped edges, its trim, and its printed name are
all legible. A surface MUST NOT lay a pack out narrower than that minimum; a surface that cannot give
a pack 120px SHALL change its own layout rather than shrink the pack below it.

#### Scenario: Everything reads at the minimum

- **WHEN** a pack is rendered at 120 CSS pixels wide
- **THEN** its crimped edges, its edge trim, and its printed tier name are each legible

#### Scenario: No surface goes below the minimum

- **WHEN** any surface lays out a pack
- **THEN** the pack is at least 120 CSS pixels wide

#### Scenario: Ornament simplifies rather than crowds

- **WHEN** a pack is rendered near its minimum supported width
- **THEN** fine decorative detail gives way so the pack stays uncluttered
- **AND** the crimped edges, the trim, the artwork, and the printed name are all still present

### Requirement: The foil sheen is ambient motion

The sheen across a pack's face SHALL read as light moving over foil — a slow travelling highlight
rather than a static gradient. Where the player has requested reduced motion, the sheen SHALL settle
into a still highlight rather than disappearing, so the face still reads as foil.

#### Scenario: The sheen moves

- **WHEN** a pack is rendered without a reduced-motion preference
- **THEN** a highlight travels across its face

#### Scenario: Reduced motion stills the sheen

- **WHEN** the player has requested reduced motion
- **THEN** the highlight does not travel
- **AND** the face still carries a foil highlight

### Requirement: A pack renders sealed or torn open

The pack renderer SHALL support two states: **sealed**, the resting state, and **torn**, the state a
pack is left in once it has been opened. A torn pack SHALL read as the same wrapper after the fact —
its top seal broken along a ragged edge, its interior open — rather than as a different object or an
empty frame.

#### Scenario: Sealed is the resting state

- **WHEN** a pack is rendered without a state being asked for
- **THEN** it renders sealed, with its top crimp intact

#### Scenario: A torn pack is the same wrapper

- **WHEN** a pack is rendered torn
- **THEN** its artwork, printed name, trim, and bottom crimp are unchanged from its sealed rendering
- **AND** its top edge reads as broken open rather than crimped

#### Scenario: The tear is visible as a change of state

- **WHEN** a sealed pack becomes torn
- **THEN** the change from an intact seal to a broken one is perceptible on the pack itself
