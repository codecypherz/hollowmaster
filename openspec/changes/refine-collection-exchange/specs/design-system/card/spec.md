## MODIFIED Requirements

### Requirement: The card face presents the card's full identity

The card face SHALL present the card's name, artwork, star rating, attack, defense, ability text, set, and number within that set. No property of the card model is withheld from the face. Wherever the application draws or announces a card's collection identity, on the face or on a surface around it, it SHALL be the set, a space, and the number after a pound sign without padding, such as `FC #1`.

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
- **THEN** their plates read `FC #2` and `FC #15`

#### Scenario: The announced identity matches

- **WHEN** a screen reader encounters the card numbered 2 in `FC`
- **THEN** its description ends with `FC #2`

### Requirement: Card interactions are keyboard accessible

A card that is actionable SHALL be reachable and operable by keyboard, and MUST expose an accessible name. A card that can be selected MUST expose its selection state. A card whose activation opens a reading presentation MUST expose that it opens a dialog, and MUST NOT expose a selection state, since it is not selected.

#### Scenario: Reaching a card by keyboard

- **WHEN** the user navigates with the keyboard
- **THEN** each actionable card receives focus in turn with a visible focus indicator

#### Scenario: Operating a card by keyboard

- **WHEN** an actionable card has focus and the user activates it
- **THEN** the same action occurs as when it is clicked

#### Scenario: Non-actionable cards are not focus targets

- **WHEN** a card is presented for display only
- **THEN** it is not reachable in the keyboard tab order

#### Scenario: A card that opens its reading presentation

- **WHEN** assistive technology reads a card on the Decks or the Collection page
- **THEN** it is announced as a button that opens a dialog
- **AND** no pressed or selected state is announced

#### Scenario: A card that is selected for play

- **WHEN** assistive technology reads a card in the player's hand in a match
- **THEN** its selection state is announced
