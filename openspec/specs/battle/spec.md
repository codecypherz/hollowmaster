## Purpose

Defines how the Battle page — the game's title screen and the player's first and most-returned-to
surface — presents itself: its title identity, the ambient light that lives on it, and an entrance
that introduces the screen without delaying the player's ability to act on it.

## Requirements

### Requirement: The title carries a continuous glow

The Battle page's title SHALL carry its luminous treatment continuously, from the moment it is
first visible through every subsequent frame. The title's ambient glow animation SHALL begin and
end at the title's resting glow, so no frame introduces a step change in the title's brightness.

At no point SHALL the title become visible without its glow, nor SHALL its glow appear, intensify,
or disappear abruptly relative to the surrounding motion.

#### Scenario: The title appears already lit

- **WHEN** the Battle page's title becomes visible during the entrance
- **THEN** its glow is present at the same moment the letterforms are
- **AND** the glow's arrival is not perceptible as a separate event from the title's arrival

#### Scenario: The ambient glow joins seamlessly

- **WHEN** the entrance finishes and the title's ambient glow animation takes over
- **THEN** the glow intensity at that instant is unchanged from the frame before it
- **AND** no flash, pop, or sudden brightening occurs

#### Scenario: The glow loops without a seam

- **WHEN** the ambient glow animation completes a cycle and repeats
- **THEN** the intensity at the loop boundary is continuous
- **AND** the title's brightness varies only gradually across the cycle

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

- **WHEN** the user navigates to the Battle page from the Shop or Cards page
- **THEN** the entrance plays at the same shortened pace
- **AND** the transition does not read as a stall before the page becomes usable

#### Scenario: The entrance pace is adjusted in one place

- **WHEN** the speed of the entrance choreography is changed
- **THEN** every staggered element's timing shifts together in proportion
- **AND** no element retains an independently declared timing that must be updated separately

### Requirement: The control that begins a battle is never gated by the entrance

Activating the control that begins a battle SHALL be possible as soon as that control is visible,
and the entrance choreography SHALL NOT suppress, delay, or intercept that interaction.

#### Scenario: Clicking during the entrance

- **WHEN** the user activates the control that begins a battle while the entrance is still playing
- **THEN** the battle begins
- **AND** the activation is not swallowed by the animation

#### Scenario: Reduced motion is requested

- **WHEN** the user's system requests reduced motion
- **THEN** the Battle page renders in its finished state with every element visible
- **AND** the control that begins a battle is immediately available
