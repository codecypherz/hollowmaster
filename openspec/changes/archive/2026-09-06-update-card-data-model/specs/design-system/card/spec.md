## REMOVED Requirements

### Requirement: Rarity rendered as stars

**Reason**: The card model replaces the open-ended `rarity` number with a star rating bounded at 1–6, so the renderer no longer clamps a value of unknown range. The requirement is restated in those terms as "Star rating rendered as stars" below; the star display itself is unchanged.

**Migration**: Read the card's star rating instead of its rarity, and drop the renderer's own upper bound — the model now guarantees the range. All display behavior (one star per level, top-left of the image section, never a numeral, legible over artwork) carries over unchanged.

## ADDED Requirements

### Requirement: Star rating rendered as stars

A card's star rating SHALL be rendered as a count of stars in the top-left corner of its image section, one star per level, for a rating between 1 and 6. The renderer MUST take the rating as given by the card model rather than clamping or defaulting it. The rating MUST NOT be displayed as a numeral.

#### Scenario: Star count matches the rating

- **WHEN** a card with a star rating of N is rendered
- **THEN** N stars appear in the top-left corner of its image section

#### Scenario: The full range renders

- **WHEN** cards spanning ratings 1 through 6 are rendered
- **THEN** each shows exactly its own number of stars, up to six for the highest

#### Scenario: The renderer does not clamp the rating

- **WHEN** a card's star rating is rendered
- **THEN** the number of stars drawn equals the card's rating exactly
- **AND** the renderer applies no upper or lower bound of its own

#### Scenario: The rating numeral is never shown

- **WHEN** a card is rendered
- **THEN** no numeric representation of its star rating appears anywhere on the card

#### Scenario: Stars stay legible over artwork

- **WHEN** stars are rendered over card artwork of any brightness
- **THEN** they remain legible against that artwork

### Requirement: The card face presents only name, artwork, stars, and stats

The card face SHALL present the card's name, artwork, star rating, attack, and defense, and SHALL NOT display the card's ability text, its set, or its number within that set. Those properties exist on the model for surfaces outside the card face.

#### Scenario: Ability text does not appear on the card face

- **WHEN** a card carrying ability text is rendered
- **THEN** the ability text does not appear anywhere on the card face

#### Scenario: Collection identity does not appear on the card face

- **WHEN** a card is rendered
- **THEN** neither its set nor its number within that set appears on the card face

#### Scenario: The three sections are unchanged by the added properties

- **WHEN** a card carrying an ability, a set, and a set number is rendered
- **THEN** it still presents exactly the name, image, and stats sections
