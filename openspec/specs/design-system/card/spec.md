## Purpose

Defines the single rendering contract for a Hollow Master card — its proportions, internal structure, directional chevrons, star rating and stat display, and its ownership and interaction states — so that every card in the application looks and behaves identically no matter which surface presents it.

## Requirements

### Requirement: Single card renderer

The application SHALL render every card through one shared card renderer. No surface may reimplement the card face in its own markup.

#### Scenario: The same card renders identically on different surfaces

- **WHEN** the same card is presented in a player's hand, on a board tile, and in an opened pack
- **THEN** all three render with identical structure, proportions, and internal layout

#### Scenario: Card markup is not duplicated

- **WHEN** any surface presents a card
- **THEN** it delegates to the shared card renderer
- **AND** it does not declare its own copy of the card face structure

#### Scenario: A card change applies everywhere at once

- **WHEN** the card renderer's structure or styling is changed
- **THEN** every surface presenting a card reflects that change

### Requirement: Trading-card aspect ratio

Every card SHALL render at a 2.5 : 3.5 aspect ratio. This ratio MUST hold at every size the card is rendered at, and for every card state including face-down opponent cards and board tiles.

#### Scenario: Aspect ratio holds at any size

- **WHEN** a card is rendered at any width
- **THEN** its height is that width multiplied by 3.5 / 2.5

#### Scenario: Face-down cards keep the ratio

- **WHEN** an opponent's face-down card is rendered
- **THEN** it has the same 2.5 : 3.5 aspect ratio as a face-up card

#### Scenario: Ratio survives viewport resizing

- **WHEN** the viewport is resized and cards are rescaled to fit
- **THEN** every card retains the 2.5 : 3.5 ratio at the new size

### Requirement: Four-section card face

A face-up card SHALL present exactly four stacked sections in order: a name section, an image section, a stats section, and an ability section. Each section MUST be visually delineated from the others.

#### Scenario: Sections render in order

- **WHEN** a face-up card is rendered
- **THEN** the name section appears at the top, the image section below it, the stats section below that, and the ability section at the bottom

#### Scenario: A long name does not break the layout

- **WHEN** a card's name is too long to fit its section
- **THEN** the name is truncated within the section
- **AND** the image, stats, and ability sections keep their positions and sizes

#### Scenario: A missing image does not collapse the section

- **WHEN** a card's artwork fails to load
- **THEN** the image section retains its allotted space
- **AND** the other three sections remain correctly positioned

#### Scenario: Long ability text does not overflow the card

- **WHEN** a card's ability text is longer than its section can display
- **THEN** the text is contained within the ability section
- **AND** no part of it escapes the card's outer border
- **AND** the other three sections keep their positions and sizes

### Requirement: The card face presents the card's full identity

The card face SHALL present the card's name, artwork, star rating, attack, defense, ability text, set, and number within that set. No property of the card model is withheld from the face.

#### Scenario: Ability text appears on the face

- **WHEN** a card carrying ability text is rendered at a width that shows the ability section
- **THEN** that ability text is displayed within the ability section

#### Scenario: Collection identity appears on the face

- **WHEN** a card is rendered at a width that shows the ability section
- **THEN** its set and its number within that set are displayed together in the bottom-right corner of the ability section

#### Scenario: Set identity does not compete with the ability text

- **WHEN** the set and number are displayed
- **THEN** they render at a smaller scale and lower emphasis than the ability text
- **AND** the ability text does not run underneath them

### Requirement: The ability section is gated by the card's rendered width

The ability section SHALL be visible when the card is rendered at 200 CSS pixels wide or wider, and hidden below that width. The gate MUST be decided from the card's own rendered width, and a surface MUST NOT have to declare, configure, or pass in which mode to use. Hiding the section is a visual measure only: the ability text MUST remain available to assistive technology at every size.

#### Scenario: A large card shows the ability

- **WHEN** a card is rendered at 200px wide or wider
- **THEN** the ability section is visible with its text and its set/number plate

#### Scenario: A small card hides the ability

- **WHEN** a card is rendered narrower than 200px
- **THEN** the ability section is not visible
- **AND** the space it would occupy is given to the other three sections rather than left blank

#### Scenario: The same card behaves differently at two sizes without being told

- **WHEN** the same card is placed in a 150px slot and a 260px slot with identical inputs
- **THEN** the 150px card hides its ability section and the 260px card shows it

#### Scenario: The gate reacts to resizing

- **WHEN** a card's slot is resized across the 200px boundary
- **THEN** the ability section appears or disappears to match, without the surface taking any action

#### Scenario: Hidden ability text is still reachable by assistive technology

- **WHEN** a card narrower than 200px is encountered by a screen reader
- **THEN** the card's ability text is available to it as text
- **AND** that text is not visible on the card

#### Scenario: The aspect ratio is unaffected by the gate

- **WHEN** a card is rendered on either side of the threshold
- **THEN** it holds the 2.5 : 3.5 ratio in both cases

### Requirement: Directional chevrons outside the sections

A card SHALL display its eight directional chevron positions within the card's outer border but outside the content sections. Chevrons for directions the card possesses MUST be rendered as active and visually distinct from inactive positions.

#### Scenario: Chevrons sit between the border and the sections

- **WHEN** a card is rendered
- **THEN** its chevrons appear inside the card's outer border
- **AND** none of them overlaps the name, image, stats, or ability section

#### Scenario: Active chevrons are distinguishable

- **WHEN** a card possesses a subset of the eight directions
- **THEN** the chevrons for those directions render in an active treatment
- **AND** the remaining positions render in a clearly dimmer inactive treatment

#### Scenario: All eight positions are represented

- **WHEN** a card is rendered
- **THEN** all eight compass positions are present in the layout regardless of which are active

#### Scenario: Chevron placement is unaffected by the ability gate

- **WHEN** a card is rendered above and below the ability section's width threshold
- **THEN** all eight chevrons occupy the same positions relative to the card's border in both cases

### Requirement: Star rating rendered on a five-slot track

A card's star rating SHALL be rendered in the top-left corner of the image section as a fixed track of five star slots, of which the first N are lit for a rating of N and the remainder render as visibly unlit slots. A rating of 6 SHALL additionally render a sixth star outside that five-slot track in a treatment distinct from the five, and that sixth star MUST be entirely absent from the layout at every rating below 6. The rating MUST NOT be displayed as a numeral.

#### Scenario: The ceiling is always visible

- **WHEN** a card with any rating from 1 to 5 is rendered
- **THEN** five star slots appear in the top-left corner of the image section
- **AND** exactly the card's rating of them render lit
- **AND** the remainder render unlit and clearly distinguishable from the lit ones

#### Scenario: A one-star card still shows five slots

- **WHEN** a 1-star card is rendered
- **THEN** one lit star and four unlit slots appear

#### Scenario: A five-star card fills the track

- **WHEN** a 5-star card is rendered
- **THEN** all five slots render lit
- **AND** no sixth star appears

#### Scenario: The sixth star is a distinct treatment beyond the track

- **WHEN** a 6-star card is rendered
- **THEN** all five slots render lit
- **AND** a sixth star renders outside the five-slot track
- **AND** it is visually distinct from the five, not merely a repetition of them

#### Scenario: The sixth star is absent, not dimmed, below six

- **WHEN** a card rated 1 through 5 is rendered
- **THEN** no sixth star position appears in any form — not lit, not unlit, not as reserved space

#### Scenario: The rating numeral is never shown

- **WHEN** a card is rendered
- **THEN** no numeric representation of its star rating appears anywhere on the card

#### Scenario: Every rating in the model's range renders distinguishably

- **WHEN** cards rated 1 through 6 are rendered side by side
- **THEN** each is distinguishable from every other by its star display alone

#### Scenario: Stars stay legible over artwork

- **WHEN** stars are rendered over card artwork of any brightness
- **THEN** both the lit and the unlit slots remain legible against that artwork

### Requirement: Stats rendered as bars without numerals

A card's attack and defense SHALL each be rendered as a progress bar filled proportionally on a 0-to-100 scale, each bar carrying its own text label within the bar itself: `AT` for attack and `DE` for defense. The two bars MUST be separately delineated rows. The numeric value of attack or defense MUST NOT appear on the card, and the bars MUST NOT be accompanied by stat icons.

#### Scenario: Bar fill is proportional

- **WHEN** a card with an attack value of N is rendered
- **THEN** its attack bar is filled to N percent of the bar's width

#### Scenario: Each bar is labelled inside itself

- **WHEN** a card is rendered
- **THEN** the text `AT` appears within the attack bar
- **AND** the text `DE` appears within the defense bar
- **AND** neither label sits outside its bar

#### Scenario: Labels stay legible over the fill and over the track

- **WHEN** a card's attack is low enough that the label sits over the empty track, and high enough on another card that it sits over the fill
- **THEN** the label is legible in both cases

#### Scenario: Stat numerals are never shown

- **WHEN** a card is rendered
- **THEN** no numeric attack or defense value appears anywhere on the card

#### Scenario: Attack and defense are distinguishable

- **WHEN** both stat bars are rendered
- **THEN** each carries its own label
- **AND** the two fills are visually distinct from one another
- **AND** the distinction does not rest on the label alone

#### Scenario: Stat icons no longer appear

- **WHEN** a card is rendered
- **THEN** no attack or defense icon image appears on the card face

#### Scenario: Stats are conveyed to assistive technology

- **WHEN** a screen reader encounters a card
- **THEN** the attack and defense values are available to it as accessible text
- **AND** that text is not rendered visually on the card

### Requirement: Only attack, defense, and the star rating are barred from appearing as numerals

The card face SHALL NOT display the numeric value of a card's attack, defense, or star rating. Every other numeral the card carries — its number within its set — MAY appear, and is required to by the card's identity requirement.

#### Scenario: Combat and rarity values stay unnumbered

- **WHEN** a card is rendered
- **THEN** no numeral representing its attack, its defense, or its star rating appears anywhere on it

#### Scenario: The collector number is a permitted numeral

- **WHEN** a card is rendered at a width that shows the ability section
- **THEN** its number within its set is displayed as a numeral

### Requirement: The frame reads as a physical trading card

The card SHALL be framed as a layered object rather than a set of flat rectangles: an outer border with depth, a recessed interior the sections sit within, and an image section that reads as a window inset into the frame. This treatment MUST hold at every size the card renders at and MUST NOT depend on artwork the card cannot supply.

#### Scenario: The frame reads as layered

- **WHEN** a card is rendered
- **THEN** its outer border, its interior, and its image window are distinguishable as separate depths

#### Scenario: The artwork settles into the frame

- **WHEN** a card's artwork is displayed
- **THEN** the artwork is visually seated within the image window rather than appearing pasted over the card

#### Scenario: Framing survives a missing image

- **WHEN** a card's artwork fails to load
- **THEN** the image window still renders as an inset window

#### Scenario: The frame does not obscure content

- **WHEN** a card is rendered at any size
- **THEN** no part of the frame treatment covers the name, the stars, the stat bars, the ability text, or any chevron

### Requirement: The frame reflects the card's rarity

The card's frame treatment SHALL vary across the star range so that a card's rarity is recognisable from the frame alone at a glance, before its stars are read. Rarity MUST remain readable from the star track independently, so the frame treatment is reinforcement and never the sole carrier of rarity.

#### Scenario: Rarity is legible across a grid

- **WHEN** cards of differing rarity are displayed together
- **THEN** their frames are distinguishable from one another

#### Scenario: The highest rarity is unmistakable

- **WHEN** a 6-star card is displayed among lower-rarity cards
- **THEN** its frame is the most distinct of them

#### Scenario: Rarity does not rest on the frame alone

- **WHEN** a card is rendered
- **THEN** its star track states its rarity independently of the frame treatment

### Requirement: Ownership and interaction states

The card renderer SHALL support distinct visual states for player ownership, opponent ownership, selection, placeability, capture, and face-down presentation, and MUST NOT convey any of these states through color alone.

#### Scenario: Ownership is visible

- **WHEN** a card on the board is owned by the player versus the opponent
- **THEN** the two render with distinguishable owner treatments

#### Scenario: A selected card is identifiable

- **WHEN** a card in the player's hand is selected
- **THEN** it renders in a selected state distinguishable from unselected cards by more than color alone

#### Scenario: An unselectable card indicates so

- **WHEN** a card cannot be selected because it is not the player's turn
- **THEN** it renders in a subdued state and does not respond to hover as an actionable card

#### Scenario: Capture is signalled

- **WHEN** a card on the board changes ownership
- **THEN** a transition plays marking the change
- **AND** the card settles into the new owner's treatment

#### Scenario: A face-down card reveals nothing

- **WHEN** an opponent's face-down card is rendered
- **THEN** it shows the card back
- **AND** its name, artwork, rarity, stats, chevrons, ability text, set, and number are not discernible

#### Scenario: Ownership reads over the rarity treatment

- **WHEN** cards of differing rarity are owned by the player and the opponent
- **THEN** the owner treatment remains identifiable on every rarity

### Requirement: Size parity across surfaces

Player cards, opponent cards, and board tiles SHALL all render at the same size within the game screen, and that size MUST be derived from one shared measurement so the three cannot diverge.

#### Scenario: Hands and board tiles match

- **WHEN** the game screen is rendered at any viewport size
- **THEN** player hand cards, opponent hand cards, and board tiles all have the same width and height

#### Scenario: Rescaling keeps parity

- **WHEN** the viewport is resized and the card size recalculates
- **THEN** all three continue to match one another at the new size

### Requirement: The card declares a minimum supported width

The card renderer SHALL declare a minimum supported width of 120 CSS pixels, at and above which every element it draws is legible. A surface MUST NOT render a card narrower than that minimum. The minimum is a property of the card, not of any surface: a surface that cannot give a card 120px must change its own layout rather than shrink the card below it.

#### Scenario: The card is legible at its minimum

- **WHEN** a card is rendered at exactly 120px wide
- **THEN** its name, its five star slots, both stat bars, and both `AT` and `DE` labels are legible
- **AND** its chevrons are individually distinguishable

#### Scenario: Surfaces honour the minimum

- **WHEN** any surface renders a card at any viewport size it supports
- **THEN** the card is at least 120px wide

#### Scenario: A constrained surface changes itself, not the card

- **WHEN** a surface does not have room to render every card it wants to show at 120px
- **THEN** it reduces how many cards it shows, rescales its own layout, or scrolls
- **AND** it does not render a card below the minimum

### Requirement: Ornament degrades gracefully with size

The card's decorative treatment SHALL simplify as the card approaches its minimum supported width, so that a small card stays uncluttered rather than crowded with detail too fine to resolve. What gives way MUST be ornament alone: every section, star slot, stat bar, label, and chevron is present at every supported size.

#### Scenario: A card at the minimum keeps its whole face

- **WHEN** a card is rendered at its minimum supported width
- **THEN** its name, all five star slots, all eight chevrons, and both labelled stat bars are present and legible
- **AND** none of them is dropped to make room

#### Scenario: Ornament is what gives way, never content

- **WHEN** a card is rendered near its minimum supported width
- **THEN** fine ornament that cannot resolve at that size — frame filigree, bar gradations, specular highlights, rim detail — is omitted rather than compressed
- **AND** no section, stat bar, label, star slot, or chevron is omitted with it

#### Scenario: A large card carries its full detail

- **WHEN** a card is rendered at a large size
- **THEN** the full frame, star, bar, and ability treatment is present

#### Scenario: Nothing clips at any supported size

- **WHEN** a card is rendered at any width from its minimum upward
- **THEN** no content is clipped by the card's border or by a section's bounds

### Requirement: Card interactions are keyboard accessible

A card that is actionable SHALL be reachable and operable by keyboard, and MUST expose an accessible name and its selection state.

#### Scenario: Reaching a card by keyboard

- **WHEN** the user navigates with the keyboard
- **THEN** each actionable card receives focus in turn with a visible focus indicator

#### Scenario: Operating a card by keyboard

- **WHEN** an actionable card has focus and the user activates it
- **THEN** the same action occurs as when it is clicked

#### Scenario: Non-actionable cards are not focus targets

- **WHEN** a card is presented for display only
- **THEN** it is not reachable in the keyboard tab order
