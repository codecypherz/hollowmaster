## Purpose

Establishes the Cards page as the place where the player will view the cards they own and assemble decks from them, delivering its route and a themed placeholder skeleton now so both experiences can be designed against a real page later.

## Requirements

### Requirement: The Cards page exists as a themed placeholder

The Cards page SHALL render a Hollow Knight-themed screen that names itself as the Cards page and states its two purposes — viewing the collection and building decks — while marking its content as forthcoming.

#### Scenario: Viewing the Cards page

- **WHEN** the user navigates to the Cards page
- **THEN** a themed page renders identifying itself as the Cards page
- **AND** placeholder content indicates that viewing the collection and building decks are what this page is for

#### Scenario: Placeholder content is honest

- **WHEN** the user views the Cards page's placeholder content
- **THEN** it does not present an owned-card collection or a saved deck as though it were real player data

### Requirement: The Cards page fits the viewport

The Cards page SHALL fit within the viewport without clipping its content and SHALL make use of the space available to it.

#### Scenario: Rendering at a range of viewport sizes

- **WHEN** the Cards page renders
- **THEN** its content is fully visible without being clipped

### Requirement: Any cards shown obey the card design constraints

Where the Cards page renders card artwork — including placeholder or sample cards — those cards SHALL follow the established card design contract: the 2.5:3.5 aspect ratio, the three sections, chevron placement, rarity stars, and numeral-free stat bars.

#### Scenario: A sample card is displayed

- **WHEN** the Cards page displays a card
- **THEN** that card is rendered by the shared card component and satisfies the card design constraints
