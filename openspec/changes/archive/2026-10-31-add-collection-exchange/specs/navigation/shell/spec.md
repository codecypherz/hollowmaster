## MODIFIED Requirements

### Requirement: The navigation shell indicates the current destination

The navigation control SHALL visually distinguish the destination matching the current route from the others.

#### Scenario: Arriving at a destination

- **WHEN** the Shop page is the current route
- **THEN** the Shop destination in the navigation control is marked as active
- **AND** the Battle, Decks, and Collection destinations are not

#### Scenario: Arriving by URL rather than by clicking

- **WHEN** the user loads a destination's route directly
- **THEN** that destination is marked as active in the navigation control

#### Scenario: Arriving by the former Cards route

- **WHEN** the user loads the route the Cards page used to live at
- **THEN** the Decks destination is marked as active once the redirect settles

## ADDED Requirements

### Requirement: The navigation shell offers four destinations in a fixed order

The application SHALL present a persistent navigation control on the Battle, Shop, Decks, and
Collection pages, offering all four destinations from any of them. The destinations SHALL be
presented in the order Shop, Battle, Decks, Collection. Shop leads, Battle follows it, and the two
card screens, Decks and then Collection, come last.

#### Scenario: The shell is present on every out-of-battle page

- **WHEN** the user is on the Battle page, the Shop page, the Decks page, or the Collection page
- **THEN** the navigation control is visible
- **AND** it offers Shop, Battle, Decks, and Collection as destinations

#### Scenario: The destinations are ordered Shop, Battle, Decks, Collection

- **WHEN** the navigation control renders
- **THEN** Shop is the first destination, Battle the second, Decks the third, and Collection the
  fourth

#### Scenario: Cards is no longer a destination

- **WHEN** the navigation control renders
- **THEN** no destination is labelled `Cards`

#### Scenario: Moving between destinations

- **WHEN** the user activates a destination in the navigation control
- **THEN** the application navigates to that destination's route
- **AND** the navigation control remains present

## REMOVED Requirements

### Requirement: A persistent navigation shell wraps the out-of-battle pages

**Reason**: The shell gains a fourth destination, and the old rule that Battle is the centre one cannot hold with four. The requirement is restated with the new destinations and order.

**Migration**: See "The navigation shell offers four destinations in a fixed order". The order is Shop, Battle, Decks, Collection.
