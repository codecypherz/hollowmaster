## ADDED Requirements

### Requirement: The card's name is fitted, never truncated

The card SHALL display its name in full. The name is rendered at a default size and reduced as the name grows longer, so that it fits the name section without truncation, ellipsis, or clipping. When the name will not fit on one line at the smallest size the card uses, it SHALL wrap within the section rather than be cut. The name section's height MUST NOT change with the length of the name, and the fitting MUST hold at every supported card width without the surface passing anything in.

#### Scenario: A short name renders at the default size

- **WHEN** a card whose name comfortably fits its section is rendered
- **THEN** the name is displayed at the card's default name size
- **AND** it is not shrunk to accommodate a length it does not have

#### Scenario: A longer name is shrunk rather than cut

- **WHEN** a card's name is too long to fit its section at the default size
- **THEN** the name is rendered smaller so that all of it fits
- **AND** no ellipsis, clipped glyph, or omitted word appears

#### Scenario: A name that will not fit one line wraps instead of truncating

- **WHEN** a card's name still exceeds one line at the smallest size the card uses
- **THEN** the name wraps within the name section
- **AND** every character of it remains visible

#### Scenario: No name escapes or is clipped by its section

- **WHEN** a card of any name length is rendered at any supported width
- **THEN** the whole name is visible inside the name section
- **AND** no part of it is clipped by the section's bounds or crosses into the image section

#### Scenario: Name length does not disturb the layout

- **WHEN** cards with a very short and a very long name are rendered side by side at the same width
- **THEN** both name sections have the same height
- **AND** their image, stats, and ability sections are identically positioned and sized

#### Scenario: Fitting holds at the minimum supported width

- **WHEN** a card is rendered at its minimum supported width
- **THEN** its name is displayed in full and remains legible

#### Scenario: The name is fitted without the surface being asked

- **WHEN** the same card is rendered in a narrow slot and a wide slot
- **THEN** the name is fitted to each
- **AND** the surface declares, configures, and measures nothing to make that happen

### Requirement: Ownership, selection, and interaction states

The card renderer SHALL support distinct visual states for player ownership, opponent ownership, selection, placeability, capture, and face-down presentation, and MUST NOT convey any of these states through color alone. The card's frame is ownership's channel: an owned card's border SHALL read as its owner's, and a card with no owner SHALL frame in the renderer's neutral treatment. No other property of the card may colour the frame.

#### Scenario: Ownership is visible on the frame

- **WHEN** a card on the board is owned by the player versus the opponent
- **THEN** the two frames render in distinguishable owner treatments
- **AND** each is distinguishable from the neutral frame of an unowned card

#### Scenario: Ownership is not carried by colour alone

- **WHEN** a card's owner treatment is rendered
- **THEN** the owner is also indicated by a non-colour cue on the card

#### Scenario: An unowned card frames neutrally

- **WHEN** a card is rendered outside play — in an opened pack, in the collection, or as an empty board tile
- **THEN** its frame renders in the neutral treatment
- **AND** it is not tinted toward either owner

#### Scenario: Every card frames alike before ownership applies

- **WHEN** cards of differing star ratings are rendered with no owner
- **THEN** their frames are identical in colour and material

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

#### Scenario: Ownership reads on every card

- **WHEN** cards of differing star ratings are owned by the player and the opponent
- **THEN** the owner treatment is equally identifiable on each of them

## MODIFIED Requirements

### Requirement: Four-section card face

A face-up card SHALL present exactly four stacked sections in order: a name section, an image section, a stats section, and an ability section. Each section MUST be visually delineated from the others, and the ability section MUST additionally be enclosed by a border on all four of its sides so that it reads as a contained box rather than an open area of the frame.

#### Scenario: Sections render in order

- **WHEN** a face-up card is rendered
- **THEN** the name section appears at the top, the image section below it, the stats section below that, and the ability section at the bottom

#### Scenario: The ability section is an enclosed box

- **WHEN** a card is rendered at a width that shows the ability section
- **THEN** the section is bounded by a visible border on its top, bottom, left, and right
- **AND** the ability text and the set/number plate sit within that border

#### Scenario: A long name does not break the layout

- **WHEN** a card's name is longer than its section would hold at the default size
- **THEN** the name is fitted to the section in full rather than truncated
- **AND** the image, stats, and ability sections keep their positions and sizes

#### Scenario: A missing image does not collapse the section

- **WHEN** a card's artwork fails to load
- **THEN** the image section retains its allotted space
- **AND** the other three sections remain correctly positioned

#### Scenario: Long ability text does not overflow the card

- **WHEN** a card's ability text is longer than its section can display
- **THEN** the text is contained within the ability section
- **AND** no part of it escapes the card's outer border or the ability section's own border
- **AND** the other three sections keep their positions and sizes

### Requirement: Stats rendered as bars without numerals

A card's attack and defense SHALL each be rendered as a progress bar filled proportionally on a 0-to-100 scale, each bar carrying its own text label, `AT` for attack and `DE` for defense. The two bars MUST be separately delineated rows. At every value the stat may hold, both the label and the bar's filled extent MUST be readable: the label MUST NOT conceal any part of the fill, and the fill MUST NOT render the label illegible. The numeric value of attack or defense MUST NOT appear on the card, and the bars MUST NOT be accompanied by stat icons.

#### Scenario: Bar fill is proportional

- **WHEN** a card with an attack value of N is rendered
- **THEN** its attack bar is filled to N percent of the bar's fillable width

#### Scenario: A low value's fill is still visible

- **WHEN** a card's attack is low enough that its fill is shorter than the `AT` label is wide
- **THEN** the fill is visible in full
- **AND** the label does not cover it

#### Scenario: A high value's label is still legible

- **WHEN** a card's defense is high enough that the fill spans the whole bar
- **THEN** the `DE` label remains legible against the fill

#### Scenario: Two different low values are distinguishable

- **WHEN** two cards whose attack values differ by a small amount at the bottom of the range are rendered side by side
- **THEN** the difference in their visible fill is discernible

#### Scenario: Each bar is labelled inside itself

- **WHEN** a card is rendered
- **THEN** the text `AT` appears within the bounds of the attack bar
- **AND** the text `DE` appears within the bounds of the defense bar
- **AND** neither label sits outside its bar or is mistakable for the other bar's

#### Scenario: Labels stay legible over the fill and over the track

- **WHEN** a card's attack is low and another card's attack is high
- **THEN** the label is legible in both cases
- **AND** in neither case does the label conceal its bar's fill

#### Scenario: Labels are legible at every supported width

- **WHEN** a card is rendered at any width from its minimum upward
- **THEN** both labels and both fills remain readable

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

## REMOVED Requirements

### Requirement: The frame reflects the card's rarity

**Reason**: The frame's colour is needed for ownership. In play, a card's border reads as the player's or the opponent's, and a frame whose metal also shifts across the star range would compete with that signal — the reader would have to separate two colour channels on the same element. Rarity already states itself on the star track, which the card renders unconditionally at every supported size, so nothing is lost by taking it off the frame.

**Migration**: Render every card in one neutral frame material regardless of star rating. Read rarity from the star track alone. Surfaces that previously compared frame treatments across the rarity range — the style guide's rarity gallery — compare star tracks instead. The per-rarity colour tokens lose their consumer and any rarity attribute the renderer exposed for styling can be dropped.

### Requirement: Ownership and interaction states

**Reason**: The requirement is restated as "Ownership, selection, and interaction states" above, so that the frame's colour can be named as ownership's channel and the scenario tying ownership to the rarity frame treatment can be dropped along with the treatment itself. Every other state it covered — selection, unselectable, capture, face-down, and the ban on conveying state by colour alone — carries over word for word.

**Migration**: Read the restated requirement. Colour the frame from ownership alone and frame an unowned card neutrally; nothing else about the card's states changes.
