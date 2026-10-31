## MODIFIED Requirements

### Requirement: The entrance settles quickly

The Battle page SHALL complete its entrance choreography — every element at rest, the control that
begins a battle fully visible and interactive — within approximately one and a half seconds of the
page rendering. The choreography SHALL retain its staggered, sequential character; it is shortened,
not removed.

#### Scenario: Arriving at the Battle page

- **WHEN** the Battle page renders
- **THEN** every element of the screen has settled into its resting state within approximately one
  and a half seconds
- **AND** the elements still arrive in sequence rather than all at once

#### Scenario: Returning from another page

- **WHEN** the user navigates to the Battle page from the Shop, Decks, or Collection page
- **THEN** the entrance plays at the same shortened pace
- **AND** the transition does not read as a stall before the page becomes usable

#### Scenario: The entrance pace is adjusted in one place

- **WHEN** the speed of the entrance choreography is changed
- **THEN** every staggered element's timing shifts together in proportion
- **AND** no element retains an independently declared timing that must be updated separately
