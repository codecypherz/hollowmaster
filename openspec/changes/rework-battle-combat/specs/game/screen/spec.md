## MODIFIED Requirements

### Requirement: Any face-up card on the screen can be inspected

Clicking or activating any face-up card on the screen — in Player 1's hand or anywhere on the board,
whoever owns it — SHALL render that card in the codex inspector. Inspecting SHALL be available on
either player's turn, while the player is choosing their next combat, and after the match has
ended. Inspecting a card SHALL NOT place it, play it, or change the match in any way. There is one
exception: while the player is choosing their next combat, activating one of the offered combat
targets chooses that combat as well as inspecting the card. The inspector SHALL be reachable by
keyboard as well as by pointer.

#### Scenario: A hand card is inspected

- **WHEN** the player activates a card in their own hand
- **THEN** that card is rendered in the codex inspector

#### Scenario: A board card is inspected

- **WHEN** the player activates a card on the board, owned by either player
- **THEN** that card is rendered in the codex inspector

#### Scenario: Inspecting changes nothing about the match

- **WHEN** a card that is not an offered combat target is inspected
- **THEN** no card is placed, captured, or removed from a hand
- **AND** the score, the turn, and the board are unchanged

#### Scenario: Inspecting works while the opponent is thinking

- **WHEN** it is the opponent's turn
- **THEN** the player can still inspect any face-up card
- **AND** the inspector updates to show it

#### Scenario: Inspecting works while choosing a combat

- **WHEN** the player is choosing their next combat and activates a board card that is not an
  offered target
- **THEN** that card is rendered in the inspector
- **AND** no combat is fought and the choice is still waiting

#### Scenario: Inspecting works after the match ends

- **WHEN** the match has ended and the result is shown
- **THEN** the player can still inspect cards on the board

#### Scenario: The inspector is keyboard reachable

- **WHEN** the player moves focus to a card with the keyboard and activates it
- **THEN** that card is rendered in the inspector

### Requirement: A turn is carried by motion

The screen SHALL animate the events of a match rather than swapping between static states. It SHALL
animate, at minimum:

- **the deal** — the eighteen cards arriving into their hand positions in a stagger rather than
  appearing at once;
- **the first-turn announcement** — the decision of who moves first arriving as an event rather
  than as a silent starting state;
- **selection** — the selected hand card rising out of the rack and taking a lit treatment;
- **placement** — the played card travelling from its hand position to the board cell it lands in,
  rather than disappearing from one and appearing in the other, and then **landing** with an impact
  beat that marks its arrival on the field;
- **combat** — each combat presented as a clash between attacker and defender, with both rolls and
  powers revealed before the outcome, as set out in "Combat is presented as a clash";
- **capture** — each taken card turning to its new owner. A combat's loser turns first, then its
  combo's cards, then any defenseless captures, all in the order the placement's record lists them
  rather than all at once;
- **inspection** — the inspector transitioning between cards rather than cutting;
- **the turn hand-off** — a visible change of state when the turn passes;
- **the score** — a score changing counts up or down visibly rather than jumping.

Every animation SHALL express its pace through the project's motion tokens rather than declaring
its own literal durations and easings.

#### Scenario: The deal is staggered

- **WHEN** a match begins
- **THEN** the cards arrive into their hand positions in sequence rather than all at once

#### Scenario: A played card travels to its cell

- **WHEN** a player places a card
- **THEN** the card is seen moving from its hand position to the target cell
- **AND** it does not simply vanish from the hand and appear on the board
- **AND** its arrival in the cell is marked by a landing beat

#### Scenario: A capture chain resolves in order

- **WHEN** one placement fights combats and takes several cards
- **THEN** the taken cards turn to their new owner in the order the placement's record lists them
- **AND** each combat's clash plays before the cards it decided turn

#### Scenario: The inspector transitions between cards

- **WHEN** the inspected card changes
- **THEN** the codex transitions from the previous card to the new one
- **AND** the transition does not resize or move the surrounding layout

#### Scenario: Motion pace is adjusted in one place

- **WHEN** the screen's motion pace is changed
- **THEN** the deal, announcement, selection, placement, landing, combat, capture, inspection,
  hand-off, and score animations shift together
- **AND** no animation retains an independently declared duration or easing

### Requirement: Motion never gates interaction

No animation on the in-game screen SHALL suppress, delay, or swallow an interaction. A card SHALL
be selectable and inspectable as soon as it is visible, including while the deal is still playing.
An animation still running SHALL NOT prevent the next legal action from being taken. A combat
presentation SHALL NOT intercept activation of the board's cells or of any other control.

#### Scenario: Acting during the deal

- **WHEN** the player selects a hand card while the deal animation is still playing
- **THEN** the card is selected and inspected
- **AND** the activation is not swallowed by the animation

#### Scenario: Acting during a capture animation

- **WHEN** capture animations from the previous placement are still playing and it is the player's
  turn
- **THEN** the player can select and place their next card
- **AND** the pending animations do not block the placement

#### Scenario: Choosing during a combat presentation

- **WHEN** a combat's clash is still playing and the player is asked to choose their next combat
- **THEN** the player can choose it at once
- **AND** the clash does not swallow the activation

#### Scenario: Retreat is never blocked by animation

- **WHEN** any animation is playing
- **THEN** the Retreat control remains operable

### Requirement: The screen honours a reduced-motion preference

When the user's system requests reduced motion, the in-game screen SHALL present every state
directly, without travel, turn, stagger, count-up, shake, burst, or ambient motion. Every element
SHALL still be visible in its finished state and every interaction SHALL still be available, and
each state change SHALL still be perceivable. A capture, a placement, a combat, the first-turn
decision, and a turn hand-off SHALL each remain noticeable without animating.

#### Scenario: The deal is instant under reduced motion

- **WHEN** the user's system requests reduced motion and a match begins
- **THEN** both hands are shown complete immediately
- **AND** no stagger, travel, or fade plays

#### Scenario: Placement and capture stay legible without motion

- **WHEN** the user's system requests reduced motion and a placement captures cards
- **THEN** the placed card appears in its cell and the captured cards show their new owner
- **AND** the change is perceivable without a travel, landing, or turn animation

#### Scenario: Combat stays legible without motion

- **WHEN** the user's system requests reduced motion and a combat is fought
- **THEN** both rolls, both powers, and the winner are shown in their finished state
- **AND** no count, shake, or burst plays

#### Scenario: Nothing is lost under reduced motion

- **WHEN** the user's system requests reduced motion
- **THEN** every column, control, and card is present and interactive
- **AND** no information is conveyed only by an animation that no longer plays

## ADDED Requirements

### Requirement: Combat is presented as a clash

Every combat SHALL be presented on screen as a clash between the attacker and the defender. The
presentation SHALL make clear which card is attacking and which is defending, and SHALL show, for
each side, its roll and its resulting power. A 100 SHALL be shown as an outright win and a 1 as an
outright loss rather than as a number. An attacker's worn-down power in a later combat SHALL be
shown as the power it actually carried in, not its stat. The presentation SHALL then show who won.
Combats from one placement SHALL be presented one at a time, in the order they were fought. The
clash SHALL be shown for the opponent's combats as well as the player's. It SHALL sit over the
board without resizing or moving any column of the arena, and SHALL NOT cover the codex.

#### Scenario: Both sides' numbers are shown

- **WHEN** a combat is fought
- **THEN** the screen shows the attacker's roll and attack power and the defender's roll and
  defense power
- **AND** it identifies which card is the attacker and which the defender

#### Scenario: Outright results are named

- **WHEN** a side rolls 100 or 1
- **THEN** the clash presents that side as winning or losing outright

#### Scenario: A worn-down attack is shown as carried

- **WHEN** an attacker fights its second combat of a turn
- **THEN** the attack power shown is the worn-down power it carried in

#### Scenario: The winner is clear

- **WHEN** a combat's clash finishes
- **THEN** the winning side is marked
- **AND** the marking does not rely on colour alone

#### Scenario: The opponent's combats are shown too

- **WHEN** the opponent places a card that fights a combat
- **THEN** that combat is presented as a clash like the player's

#### Scenario: The clash does not disturb the layout

- **WHEN** a clash is presented
- **THEN** no column of the arena resizes or moves
- **AND** the codex and its Retreat control remain visible

### Requirement: The player chooses their next combat on the board

When the match is waiting for the player to choose their next combat, the screen SHALL mark every
offered combat target on the board, distinctly from every other cell, and SHALL make clear in the
standing panel that a combat is to be chosen. Activating a marked target SHALL choose it. The
marking SHALL NOT rely on colour alone, and each marked target SHALL be reachable and choosable by
keyboard. When the choice has been made and fewer than two targets remain, the marking SHALL be
removed.

#### Scenario: Offered targets are marked

- **WHEN** the player places a card with two combat targets
- **THEN** both target cells are marked as choosable
- **AND** no other cell carries that marking

#### Scenario: The standing panel asks for a choice

- **WHEN** the match is waiting for the player to choose a combat
- **THEN** the standing panel says that a combat is to be chosen

#### Scenario: Choosing by pointer

- **WHEN** the player clicks a marked target
- **THEN** that combat is fought

#### Scenario: Choosing by keyboard

- **WHEN** the player moves focus to a marked target and activates it
- **THEN** that combat is fought

#### Scenario: The marking clears

- **WHEN** the player's choice leaves one or no combat target remaining
- **THEN** no cell is marked as choosable

### Requirement: The first turn is announced

When a match begins, the screen SHALL announce who moves first and why: both decks' star totals,
and whether a coin flip decided it. The announcement SHALL NOT block any interaction, and SHALL be
announced to assistive technology as well as shown.

#### Scenario: The star totals are shown

- **WHEN** a match begins
- **THEN** both decks' star totals are shown alongside which player moves first

#### Scenario: A coin flip is named

- **WHEN** a match begins with equal star totals
- **THEN** the announcement says a coin flip decided who moves first

#### Scenario: The announcement does not block play

- **WHEN** the announcement is showing and it is the player's turn
- **THEN** the player can select and place a card at once
