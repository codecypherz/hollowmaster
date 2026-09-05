## Purpose

Defines the persistent navigation chrome shared by the out-of-battle pages — which destinations it offers, how it signals where the player currently is, and the rule that it surrenders the viewport entirely once a battle begins.

## ADDED Requirements

### Requirement: A persistent navigation shell wraps the out-of-battle pages

The application SHALL present a persistent navigation control on the Battle, Shop, and Cards pages, offering all three destinations from any of them.

#### Scenario: The shell is present on every out-of-battle page

- **WHEN** the user is on the Battle page, the Shop page, or the Cards page
- **THEN** the navigation control is visible
- **AND** it offers Battle, Shop, and Cards as destinations

#### Scenario: Moving between destinations

- **WHEN** the user activates a destination in the navigation control
- **THEN** the application navigates to that destination's route
- **AND** the navigation control remains present

### Requirement: The navigation shell indicates the current destination

The navigation control SHALL visually distinguish the destination matching the current route from the others.

#### Scenario: Arriving at a destination

- **WHEN** the Shop page is the current route
- **THEN** the Shop destination in the navigation control is marked as active
- **AND** the Battle and Cards destinations are not

#### Scenario: Arriving by URL rather than by clicking

- **WHEN** the user loads a destination's route directly
- **THEN** that destination is marked as active in the navigation control

### Requirement: The navigation shell yields the viewport during a battle

While a battle is in progress and the in-game screen is showing, the navigation control MUST NOT be rendered. The in-game screen SHALL have the full viewport available to it, so that the board, every board tile, and the player's and opponent's cards remain fully visible and unclipped.

#### Scenario: Entering a battle

- **WHEN** the user begins a battle and the in-game screen renders
- **THEN** the navigation control is not visible
- **AND** no space is reserved for it

#### Scenario: The in-game layout constraints still hold

- **WHEN** the in-game screen renders
- **THEN** the board, all board tiles, the player's cards, and the opponent's cards are all visible without clipping

#### Scenario: Returning from a battle

- **WHEN** the user leaves the battle and returns to the Battle page
- **THEN** the navigation control is visible again

### Requirement: The navigation shell follows the Hollow Knight visual language

The navigation control SHALL be built from the established design tokens and shared primitives, so it reads as part of the same Hallownest-themed surface as the pages it wraps.

#### Scenario: Themed presentation

- **WHEN** the navigation control renders
- **THEN** its colours, type, and ornament come from the existing token set rather than from values defined only for it

### Requirement: Development-only routes are absent from navigation

The navigation control MUST NOT offer any development-only route as a destination.

#### Scenario: The style guide is not a destination

- **WHEN** the navigation control renders
- **THEN** the style guide is not among the destinations offered
