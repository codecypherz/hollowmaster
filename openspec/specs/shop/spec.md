## Purpose

Establishes the Shop as a place in the site where the player will buy packs of cards, delivering its route and a themed placeholder skeleton now so the purchasing experience can be designed against a real page later.

## Requirements

### Requirement: The Shop page exists as a themed placeholder

The Shop page SHALL render a Hollow Knight-themed screen that names itself as the Shop, states its purpose — buying packs of cards — and marks its content as forthcoming.

#### Scenario: Viewing the Shop

- **WHEN** the user navigates to the Shop
- **THEN** a themed page renders identifying itself as the Shop
- **AND** placeholder content indicates that buying packs of cards is what this page is for

#### Scenario: Placeholder content is honest

- **WHEN** the user views the Shop's placeholder content
- **THEN** it does not present purchasable packs, prices, or a currency balance as though they were functional

### Requirement: The Shop page fits the viewport

The Shop page SHALL fit within the viewport without clipping its content and SHALL make use of the space available to it.

#### Scenario: Rendering at a range of viewport sizes

- **WHEN** the Shop page renders
- **THEN** its content is fully visible without being clipped
