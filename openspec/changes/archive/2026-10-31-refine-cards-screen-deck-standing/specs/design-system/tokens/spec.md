## MODIFIED Requirements

### Requirement: Semantic color roles

The token set SHALL express color as named semantic roles rather than raw color names, covering at
minimum:

- the void background field
- the soul (player) accent
- the gold (ornament and structure) accent
- the crimson (opponent) accent
- a text ramp spanning dim to bright
- a scrim: the translucent near-ground wash laid over artwork and behind overlaid content to hold
  text legible
- two status roles: a **warning** role (yellow) and an **error** role (red)

The scrim SHALL be derived from the ground rather than stated independently, so that a change to
the ground carries the scrim with it and no surface is left washing with a stale copy of a former
ground value.

The status roles SHALL be named separately from the accents. A warning SHALL NOT be expressed with
the gold role and an error SHALL NOT be expressed with the crimson role, so that ornament and
opponent ownership never read as a status, and the status colours can be tuned without moving
either accent. The warning role SHALL be visibly distinct from gold and visibly softer than the
error role. Each status role SHALL be legible as text on the ground.

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

#### Scenario: A surface reports a problem through a status role

- **WHEN** a surface states an error or a warning
- **THEN** it uses the error or warning status role respectively
- **AND** it does not use the crimson or gold accent for that purpose

#### Scenario: Warning and error are told apart

- **WHEN** the warning and error roles are rendered side by side as text on the ground
- **THEN** the warning reads as yellow and the error as red
- **AND** the warning is visibly distinct from the gold accent
- **AND** both are legible against the ground
