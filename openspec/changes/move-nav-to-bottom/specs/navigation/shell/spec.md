## ADDED Requirements

### Requirement: The navigation shell is anchored to the bottom of the viewport

On the out-of-battle pages the navigation control SHALL occupy the bottom of the viewport, below the routed page's content. It MUST NOT overlay or obscure any part of that content: the page occupies the height above the control, and the control occupies the height below it.

#### Scenario: The control sits below the page

- **WHEN** an out-of-battle page renders
- **THEN** the navigation control appears at the bottom of the viewport
- **AND** the page's content occupies the area above it

#### Scenario: No page content is hidden beneath the control

- **WHEN** an out-of-battle page renders at any viewport size
- **THEN** no part of the page's content is covered by the navigation control
- **AND** the page's own full-bleed treatment stops at the control's top edge rather than running underneath it

#### Scenario: The dividing edge separates the control from the page above

- **WHEN** the navigation control renders
- **THEN** its ornamental dividing line falls between the control and the page above it

## MODIFIED Requirements

### Requirement: A persistent navigation shell wraps the out-of-battle pages

The application SHALL present a persistent navigation control on the Battle, Shop, and Cards pages, offering all three destinations from any of them. The destinations SHALL be presented in the order Shop, Battle, Cards — so that Battle, the primary destination, occupies the centre position and Shop the leading one.

#### Scenario: The shell is present on every out-of-battle page

- **WHEN** the user is on the Battle page, the Shop page, or the Cards page
- **THEN** the navigation control is visible
- **AND** it offers Battle, Shop, and Cards as destinations

#### Scenario: The destinations are ordered Shop, Battle, Cards

- **WHEN** the navigation control renders
- **THEN** Shop is the first destination, Battle the second, and Cards the third
- **AND** Battle is the centre of the three

#### Scenario: Moving between destinations

- **WHEN** the user activates a destination in the navigation control
- **THEN** the application navigates to that destination's route
- **AND** the navigation control remains present

### Requirement: The navigation shell follows the Hollow Knight visual language

The navigation control SHALL be built from the established design tokens and shared primitives, so it reads as part of the same Hallownest-themed surface as the pages it wraps. Its destination controls SHALL be sized by a size step the shared button primitive offers, not by metrics defined only for the navigation control.

#### Scenario: Themed presentation

- **WHEN** the navigation control renders
- **THEN** its colours, type, and ornament come from the existing token set rather than from values defined only for it

#### Scenario: Destination controls are sized by the design system

- **WHEN** the navigation control's destination controls render
- **THEN** their type size and padding come from a size step of the shared button primitive
- **AND** the navigation control declares no button metrics of its own

#### Scenario: Changing the primitive's large size propagates to the shell

- **WHEN** the shared button primitive's large size step changes
- **THEN** the navigation control's destination controls change with it
