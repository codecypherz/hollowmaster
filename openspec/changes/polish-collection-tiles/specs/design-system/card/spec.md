## MODIFIED Requirements

### Requirement: The card face presents the card's full identity

The card face SHALL present the card's name, artwork, star rating, attack, defense, ability text, set, and number within that set. No property of the card model is withheld from the face. Wherever the application draws or announces a card's collection identity, on the face or on a surface around it, it SHALL be the set followed directly by a pound sign and the number, with no space and no padding, such as `FC#1`.

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

#### Scenario: The number is marked and not padded

- **WHEN** the cards numbered 2 and 15 in `FC` are rendered at a width that shows the ability section
- **THEN** their plates read `FC#2` and `FC#15`
- **AND** no gap wider than the plate's ordinary letter spacing separates the set from the pound sign

#### Scenario: The announced identity matches

- **WHEN** a screen reader encounters the card numbered 2 in `FC`
- **THEN** its description ends with `FC#2`
