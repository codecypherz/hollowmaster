## MODIFIED Requirements

### Requirement: The card declares a minimum supported width

The card renderer SHALL declare a minimum supported width of 120 CSS pixels, at and above which every element it draws is legible. A surface MUST NOT lay a card out narrower than that minimum. The minimum is a property of the card, not of any surface: a surface that cannot give a card 120px must change its own layout rather than shrink the card below it.

The minimum governs the width a card is **laid out** at — the width from which the card derives its own internal sizing and its width-gated decisions. A surface MAY additionally apply a uniform scale to a whole region of itself, including the cards within it, as a way of fitting that region to a viewport it does not otherwise fit. Such a scale is a property of the surface, not of the card: the card is still laid out at or above its minimum, still decides its ability gate, its ornament, and its type fitting from that laid-out width, and is scaled afterward together with everything around it in the same proportion. A surface MUST NOT use a uniform scale to obtain a card layout it could not obtain honestly — scaling a region is permitted, scaling one card alone to fit it into a slot is not.

#### Scenario: The card is legible at its minimum

- **WHEN** a card is rendered at exactly 120px wide
- **THEN** its name, its five star slots, both stat bars, and both `AT` and `DE` labels are legible
- **AND** its chevrons are individually distinguishable

#### Scenario: Surfaces honour the minimum

- **WHEN** any surface lays a card out at any viewport size it supports
- **THEN** the card is laid out at least 120px wide

#### Scenario: A constrained surface changes itself, not the card

- **WHEN** a surface does not have room to lay every card it wants to show out at 120px
- **THEN** it reduces how many cards it shows, rescales its own layout, scrolls, or uniformly scales the whole region those cards sit in
- **AND** it does not lay a card out below the minimum

#### Scenario: A uniformly scaled region keeps the card's decisions intact

- **WHEN** a surface uniformly scales a region containing cards laid out at or above the minimum
- **THEN** each card's ability gate, ornament level, and name fitting are those of its laid-out width, not of its scaled appearance
- **AND** the cards keep their 2.5 : 3.5 ratio and their positions relative to everything else in the region

#### Scenario: A single card is not scaled to dodge the minimum

- **WHEN** a surface has a slot narrower than the minimum
- **THEN** it does not lay a card out at the minimum and scale that card alone down into the slot
- **AND** it changes its own layout instead
