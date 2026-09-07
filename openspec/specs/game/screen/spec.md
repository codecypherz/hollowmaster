## Purpose

Defines how the in-game screen presents a match — its four-column arena, the standing and Retreat
control, the inspector that renders whichever card the player is reading, how the whole arena is
fitted into a landscape viewport without clipping or scrolling, and the motion that carries a turn
from hand to board.

## Requirements

### Requirement: The arena is four columns

The in-game screen SHALL lay out as four columns across the viewport, in this order from the
leading edge:

1. **Codex** — the players' standing and the Retreat control above, the inspected card below.
2. **Player 1's hand.**
3. **The board.**
4. **Player 2's hand.**

Every column SHALL be present for the whole match. No column may be collapsed, hidden, or moved
behind another to make room.

#### Scenario: All four columns are present

- **WHEN** the in-game screen renders
- **THEN** the codex, Player 1's hand, the board, and Player 2's hand are all visible
- **AND** they appear in that order across the viewport

#### Scenario: The two hands sit on opposite sides of the board

- **WHEN** the in-game screen renders
- **THEN** Player 1's hand is between the codex and the board
- **AND** Player 2's hand is on the far side of the board

#### Scenario: No column is dropped to make room

- **WHEN** the viewport is resized to any size the screen supports
- **THEN** all four columns remain present and visible

### Requirement: The in-game screen has no footer

The in-game screen SHALL NOT present a footer. No band of the viewport below the arena may be
reserved for controls, status, or navigation. Every control the screen offers SHALL live inside one
of the four columns.

#### Scenario: No footer band exists

- **WHEN** the in-game screen renders
- **THEN** no footer region appears below the arena
- **AND** no vertical space is reserved for one

#### Scenario: The Retreat control lives in the codex

- **WHEN** the player looks for the control that abandons the match
- **THEN** it is in the codex column, not in a footer

### Requirement: The codex carries both players' standing

The top of the codex column SHALL present, for both players, their name and their current score,
and SHALL make clear whose turn it is. Each player's presentation SHALL carry their side's identity
by more than colour alone. The Retreat control SHALL sit in this same panel and SHALL be operable
whenever the match is in progress.

#### Scenario: Both players' standing is visible

- **WHEN** the in-game screen renders
- **THEN** Player 1's name and score and Player 2's name and score are all visible in the codex

#### Scenario: The active player is identifiable

- **WHEN** it is one player's turn
- **THEN** the standing panel marks that player as active
- **AND** the marking does not rely on colour alone

#### Scenario: Scores update as ownership changes

- **WHEN** a placement captures cards
- **THEN** both scores in the standing panel update to the new counts

#### Scenario: Retreat is available throughout

- **WHEN** the match is in progress, on either player's turn
- **THEN** the Retreat control is visible and operable

### Requirement: The codex renders the inspected card at readable size

Below the standing panel, the codex SHALL render the currently inspected card. That render SHALL be
at least 200 CSS pixels wide, so the card renderer presents the card's ability text, set, and number
(see `design-system/card`). It SHALL be the largest card on the screen. Before any card has been
inspected, the codex SHALL present a resting state in the inspected card's place rather than
collapsing the space.

#### Scenario: The inspected card shows its full face

- **WHEN** a card is inspected
- **THEN** it renders in the codex at 200px wide or wider
- **AND** its ability text, set, and number are visible

#### Scenario: The inspector is the largest card on screen

- **WHEN** the in-game screen renders with a card inspected
- **THEN** that card is rendered larger than any card in either hand or on the board

#### Scenario: The space is held before anything is inspected

- **WHEN** the in-game screen renders and no card has been inspected yet
- **THEN** the codex presents a resting state where the inspected card will appear
- **AND** the other columns are positioned exactly as they will be once a card is inspected

### Requirement: Any face-up card on the screen can be inspected

Clicking or activating any face-up card on the screen — in Player 1's hand or anywhere on the board,
whoever owns it — SHALL render that card in the codex inspector. Inspecting SHALL be available on
either player's turn and after the match has ended. Inspecting a card SHALL NOT place it, play it,
or change the match in any way. The inspector SHALL be reachable by keyboard as well as by pointer.

#### Scenario: A hand card is inspected

- **WHEN** the player activates a card in their own hand
- **THEN** that card is rendered in the codex inspector

#### Scenario: A board card is inspected

- **WHEN** the player activates a card on the board, owned by either player
- **THEN** that card is rendered in the codex inspector

#### Scenario: Inspecting changes nothing about the match

- **WHEN** a card is inspected
- **THEN** no card is placed, captured, or removed from a hand
- **AND** the score, the turn, and the board are unchanged

#### Scenario: Inspecting works while the opponent is thinking

- **WHEN** it is the opponent's turn
- **THEN** the player can still inspect any face-up card
- **AND** the inspector updates to show it

#### Scenario: Inspecting works after the match ends

- **WHEN** the match has ended and the result is shown
- **THEN** the player can still inspect cards on the board

#### Scenario: The inspector is keyboard reachable

- **WHEN** the player moves focus to a card with the keyboard and activates it
- **THEN** that card is rendered in the inspector

### Requirement: Inspecting a face-down card reveals nothing

A face-down card SHALL NOT become inspectable. Activating one SHALL NOT render its face, its name,
its artwork, its stars, its stats, its chevrons, its ability, or its set in the inspector or
anywhere else, and SHALL NOT change which card the inspector currently shows.

#### Scenario: An opponent's hand card reveals nothing

- **WHEN** the player activates one of Player 2's face-down hand cards
- **THEN** nothing about that card is rendered anywhere on the screen
- **AND** the inspector continues to show whatever it showed before

#### Scenario: A captured card becomes inspectable only once face up

- **WHEN** the opponent plays a card from hand onto the board
- **THEN** that card is face up on the board and can be inspected from that point on

### Requirement: Inspecting is distinct from selecting a card to play

Selecting a card to play and inspecting a card are separate states. Activating a card in the
player's own hand on their own turn SHALL both select it for placement and inspect it. Activating a
card on the board SHALL inspect it only, and SHALL NOT select, deselect, or replace the card
currently selected for placement. The two states SHALL be visually distinguishable: the selected
hand card SHALL carry a selection treatment that the merely inspected card does not.

#### Scenario: A hand card is selected and inspected together

- **WHEN** the player activates a card in their hand on their turn
- **THEN** that card is selected for placement
- **AND** the same card is rendered in the inspector

#### Scenario: Inspecting a board card preserves the selection

- **WHEN** the player has a hand card selected and then activates a card on the board
- **THEN** the board card is rendered in the inspector
- **AND** the hand card remains selected for placement

#### Scenario: The selected card is distinguishable from the inspected card

- **WHEN** the selected hand card and the inspected card are different cards
- **THEN** the selected card carries the selection treatment in the hand
- **AND** the inspected card is identifiable in the codex without carrying that treatment

#### Scenario: Placing a card clears the selection but not the inspector

- **WHEN** the player places the selected card on the board
- **THEN** no hand card is selected any more
- **AND** the inspector continues to show a card rather than emptying

### Requirement: Both hands are presented alike

Player 1's hand and Player 2's hand SHALL each present nine card positions in the same arrangement,
mirrored across the board. A position whose card has been played SHALL remain visible as an empty
position rather than closing up, so the shape of both hands is stable for the whole match. Player
1's cards SHALL be face up and Player 2's face down.

#### Scenario: Both hands show nine positions

- **WHEN** the in-game screen renders at the start of a match
- **THEN** each hand column shows nine card positions

#### Scenario: The hands mirror each other

- **WHEN** both hands are rendered
- **THEN** they use the same arrangement of positions
- **AND** the arrangement is mirrored about the board

#### Scenario: A played position stays in place

- **WHEN** a card is played from a hand position
- **THEN** that position renders as empty
- **AND** the remaining cards do not move to fill it

#### Scenario: The opponent's hand is face down

- **WHEN** Player 2's hand is rendered
- **THEN** every card in it is face down

### Requirement: The whole arena fits the viewport

The in-game screen SHALL fit entirely within the viewport at all times. It SHALL NOT produce a
horizontal or vertical scrollbar, and no part of the standing panel, the inspector, either hand,
the board, or any card in them SHALL be clipped or pushed outside the viewport. The screen SHALL
hold this at every viewport size and through any resize, and SHALL be laid out for landscape
proportions.

#### Scenario: No scrollbar appears

- **WHEN** the in-game screen renders at any viewport size
- **THEN** the page does not scroll horizontally or vertically

#### Scenario: Nothing is clipped

- **WHEN** the in-game screen renders at any viewport size
- **THEN** every hand position, every board cell, the standing panel, and the inspector are fully
  within the viewport

#### Scenario: Resizing preserves the fit

- **WHEN** the viewport is resized, in either dimension, while a match is in progress
- **THEN** the arena refits immediately
- **AND** no scrollbar appears and nothing is clipped at any point during the resize

#### Scenario: The arena is bound by whichever dimension is scarcer

- **WHEN** the viewport is wide and short
- **THEN** the arena is sized by the available height
- **WHEN** the viewport is narrow and tall
- **THEN** the arena is sized by the available width

#### Scenario: The board and hands stay in proportion

- **WHEN** the arena is refitted at any viewport size
- **THEN** the hand cards and the board cards are the same size as each other
- **AND** the inspector remains the largest card on the screen

### Requirement: A viewport too small for the arena scales it rather than breaking it

Where the viewport cannot host the arena with its cards laid out at the card renderer's minimum
supported width, the screen SHALL scale the entire arena uniformly as a single object so that it
still fits. Scaling SHALL preserve the arena's proportions and its four-column arrangement, and
SHALL NOT re-lay-out, reflow, crop, or omit any part of it. The screen SHALL NOT respond to a small
viewport by laying a card out below the renderer's minimum.

#### Scenario: A small viewport scales rather than clips

- **WHEN** the viewport is too small to host the arena at the card's minimum supported width
- **THEN** the whole arena is scaled down uniformly to fit
- **AND** all four columns, all eighteen hand positions, and all twenty-five cells remain visible

#### Scenario: Scaling does not rearrange the arena

- **WHEN** the arena is scaled to fit a small viewport
- **THEN** its four-column arrangement and its proportions are unchanged
- **AND** no element is moved, wrapped, cropped, or dropped

#### Scenario: A large viewport does not scale

- **WHEN** the viewport is large enough to host the arena with cards at or above the minimum
  supported width
- **THEN** no scaling is applied
- **AND** the arena is laid out at its natural size

#### Scenario: Cards are never laid out below the minimum

- **WHEN** the arena is fitted at any viewport size
- **THEN** every card is laid out at or above the card renderer's minimum supported width

### Requirement: A turn is carried by motion

The screen SHALL animate the events of a match rather than swapping between static states. It SHALL
animate, at minimum:

- **the deal** — the eighteen cards arriving into their hand positions in a stagger rather than
  appearing at once;
- **selection** — the selected hand card rising out of the rack and taking a lit treatment;
- **placement** — the played card travelling from its hand position to the board cell it lands in,
  rather than disappearing from one and appearing in the other;
- **capture** — each captured card turning to its new owner, with a chained capture's cards turning
  in the order they were captured rather than all at once;
- **inspection** — the inspector transitioning between cards rather than cutting;
- **the turn hand-off** — a visible change of state when the turn passes;
- **the score** — a score changing counts up or down visibly rather than jumping.

Every animation SHALL express its pace through the project's motion tokens rather than declaring
its own literal durations and easings.

#### Scenario: The deal is staggered

- **WHEN** a match begins
- **THEN** the cards arrive into their hand positions in sequence rather than all at once

#### Scenario: A played card travels to its cell

- **WHEN** the player places a selected card
- **THEN** the card is seen moving from its hand position to the target cell
- **AND** it does not simply vanish from the hand and appear on the board

#### Scenario: A capture chain resolves in order

- **WHEN** one placement captures several cards in a chain
- **THEN** the captured cards turn to their new owner in the order they were captured
- **AND** the sequence reads as one propagating chain rather than a simultaneous flip

#### Scenario: The inspector transitions between cards

- **WHEN** the inspected card changes
- **THEN** the codex transitions from the previous card to the new one
- **AND** the transition does not resize or move the surrounding layout

#### Scenario: Motion pace is adjusted in one place

- **WHEN** the screen's motion pace is changed
- **THEN** the deal, selection, placement, capture, inspection, hand-off, and score animations shift
  together
- **AND** no animation retains an independently declared duration or easing

### Requirement: Motion never gates interaction

No animation on the in-game screen SHALL suppress, delay, or swallow an interaction. A card SHALL
be selectable and inspectable as soon as it is visible, including while the deal is still playing.
An animation still running SHALL NOT prevent the next legal action from being taken.

#### Scenario: Acting during the deal

- **WHEN** the player selects a hand card while the deal animation is still playing
- **THEN** the card is selected and inspected
- **AND** the activation is not swallowed by the animation

#### Scenario: Acting during a capture animation

- **WHEN** capture animations from the previous placement are still playing and it is the player's
  turn
- **THEN** the player can select and place their next card
- **AND** the pending animations do not block the placement

#### Scenario: Retreat is never blocked by animation

- **WHEN** any animation is playing
- **THEN** the Retreat control remains operable

### Requirement: The screen honours a reduced-motion preference

When the user's system requests reduced motion, the in-game screen SHALL present every state
directly, without travel, turn, stagger, count-up, or ambient motion. Every element SHALL still be
visible in its finished state and every interaction SHALL still be available, and each state change
SHALL still be perceivable — a capture, a placement, and a turn hand-off SHALL each remain
noticeable without animating.

#### Scenario: The deal is instant under reduced motion

- **WHEN** the user's system requests reduced motion and a match begins
- **THEN** both hands are shown complete immediately
- **AND** no stagger, travel, or fade plays

#### Scenario: Placement and capture stay legible without motion

- **WHEN** the user's system requests reduced motion and a placement captures cards
- **THEN** the placed card appears in its cell and the captured cards show their new owner
- **AND** the change is perceivable without a travel or turn animation

#### Scenario: Nothing is lost under reduced motion

- **WHEN** the user's system requests reduced motion
- **THEN** every column, control, and card is present and interactive
- **AND** no information is conveyed only by an animation that no longer plays
