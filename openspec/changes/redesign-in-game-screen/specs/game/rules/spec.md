## Purpose

Defines the rules of a Hollow Master match — the board's dimensions, how each player's hand is
dealt, whose turn it is, how a placed card captures its neighbours, how score is counted, and when
and how a match concludes — so that the rules are one stated contract rather than a set of literals
inside whatever code happens to implement them.

## ADDED Requirements

### Requirement: The board is a five-by-five grid

A match SHALL be played on a square board of five rows by five columns, giving twenty-five cells.
Every cell SHALL be playable; the board SHALL NOT contain blocked, void, or otherwise unusable
cells. The board's dimensions SHALL be stated in exactly one place, and every rule that depends on
them — placement legality, capture adjacency, edge bounds, board fullness — SHALL derive from that
statement rather than restating it.

#### Scenario: A new match presents twenty-five empty cells

- **WHEN** a match begins
- **THEN** the board has five rows and five columns
- **AND** all twenty-five cells are empty and playable

#### Scenario: No cell is unplayable

- **WHEN** a match begins
- **THEN** no cell is marked blocked, void, or otherwise excluded from play

#### Scenario: The dimensions are stated once

- **WHEN** the board's dimensions are changed
- **THEN** placement legality, capture adjacency, edge bounds, and board fullness all follow the
  new dimensions
- **AND** no rule retains a separately declared copy of the old dimensions

### Requirement: Each player is dealt nine cards

At the start of a match each player SHALL be dealt a hand of nine cards drawn from the card
database. A hand slot SHALL retain its position for the whole match: playing the card in a slot
empties that slot rather than shifting the remaining cards.

#### Scenario: Both hands start at nine

- **WHEN** a match begins
- **THEN** the player's hand holds nine cards
- **AND** the opponent's hand holds nine cards

#### Scenario: A played card leaves its slot empty

- **WHEN** a player plays the card in a given hand slot
- **THEN** that slot becomes empty
- **AND** every other card in the hand remains in the slot it occupied

### Requirement: The deal permits duplicate cards

The deal SHALL NOT require the eighteen dealt cards to be distinct. The same card from the database
MAY appear more than once within a hand and MAY appear in both hands in the same match. The deal
SHALL succeed for any card database holding at least one card.

#### Scenario: The deal succeeds with fewer than eighteen distinct cards

- **WHEN** a match is dealt from a card database holding fewer than eighteen cards
- **THEN** both hands are filled to nine cards
- **AND** the deal does not fail, truncate a hand, or leave a hand slot empty

#### Scenario: A duplicated card is an independent card in play

- **WHEN** the same card is dealt into two hand slots
- **THEN** each is played, captured, and scored independently of the other
- **AND** playing one does not affect the other

#### Scenario: Hands vary between matches

- **WHEN** two matches are dealt in succession
- **THEN** the hands are not required to be identical between them

### Requirement: A player's score is the number of cards they own

A player's score SHALL be the count of cards that player owns, counting both the cards remaining in
their hand and the cards they own on the board. The two players' scores SHALL therefore always sum
to eighteen, at every point in the match.

#### Scenario: Scores start at nine apiece

- **WHEN** a match begins and no card has been played
- **THEN** each player's score is nine

#### Scenario: Playing a card does not change the player's score

- **WHEN** a player plays a card from hand to the board and captures nothing
- **THEN** their score is unchanged
- **AND** the opponent's score is unchanged

#### Scenario: A capture moves one point

- **WHEN** a placement captures one of the opponent's cards
- **THEN** the capturing player's score rises by one
- **AND** the captured player's score falls by one

#### Scenario: The scores always sum to eighteen

- **WHEN** the score is read at any point in a match
- **THEN** the two scores sum to eighteen

### Requirement: Turns alternate, beginning with the player

The player SHALL take the first turn of a match, and turns SHALL alternate between the player and
the opponent. A player SHALL be able to act only on their own turn. The opponent's turn SHALL be
taken automatically without the player acting.

#### Scenario: The player moves first

- **WHEN** a match begins
- **THEN** it is the player's turn
- **AND** the opponent has placed no card

#### Scenario: The turn passes after a placement

- **WHEN** the player places a card
- **THEN** the turn passes to the opponent
- **AND** the opponent takes its turn without the player acting

#### Scenario: The player cannot act out of turn

- **WHEN** it is the opponent's turn
- **THEN** the player cannot select or place a card
- **AND** an attempt to do so changes nothing about the match

### Requirement: A card may be placed only in an empty cell on its owner's turn

A placement SHALL be accepted only when it is the placing player's turn, the placing player has
selected a card in their own hand, and the target cell is empty. A placement failing any of these
SHALL leave the match state entirely unchanged.

#### Scenario: A legal placement is accepted

- **WHEN** the player selects a card from their hand on their turn and chooses an empty cell
- **THEN** the card is placed in that cell owned by the player
- **AND** the card leaves their hand

#### Scenario: An occupied cell rejects a placement

- **WHEN** the player chooses a cell that already holds a card
- **THEN** no card is placed
- **AND** the selected card remains in hand and remains selected

#### Scenario: A placement with no card selected does nothing

- **WHEN** the player chooses an empty cell with no card selected
- **THEN** no card is placed and the match state is unchanged

### Requirement: A placed card captures the neighbours its chevrons point at

When a card is placed, it SHALL contest each of the eight adjacent cells its chevrons point at. A
contest occurs only where the adjacent cell holds a card owned by the other player. The placed
card's attack and the defender's defense are each varied within plus or minus twenty percent of
their stated values, and the defender is captured when the varied attack exceeds the varied
defense. A captured card SHALL change ownership and SHALL NOT change any other property. A capture
SHALL then contest the captured card's own chevrons in the same way, so captures propagate as a
chain. A chevron pointing off the edge of the board SHALL contest nothing.

#### Scenario: A chevron-pointed opposing card is contested

- **WHEN** a placed card has a chevron pointing at an adjacent cell holding an opposing card
- **THEN** that card is contested

#### Scenario: A cell no chevron points at is untouched

- **WHEN** an adjacent cell holds an opposing card but no chevron of the placed card points at it
- **THEN** that card is not contested and does not change ownership

#### Scenario: A friendly neighbour is never contested

- **WHEN** a placed card's chevron points at an adjacent cell holding a card the placing player
  already owns
- **THEN** that card is not contested

#### Scenario: A capture changes only ownership

- **WHEN** a card is captured
- **THEN** its owner becomes the capturing player
- **AND** its name, artwork, chevrons, stars, attack, defense, ability, set, and number are
  unchanged

#### Scenario: Captures chain

- **WHEN** a card is captured and its own chevrons point at further opposing cards
- **THEN** those cards are contested in turn
- **AND** any that fall are recorded as part of the same placement's captures

#### Scenario: A chevron at the board edge contests nothing

- **WHEN** a card is placed in an edge or corner cell with chevrons pointing off the board
- **THEN** those chevrons contest nothing
- **AND** the placement resolves normally for the chevrons that remain on the board

#### Scenario: Combat outcomes vary between identical placements

- **WHEN** the same attacker contests the same defender repeatedly with attack and defense close
  enough for the variance to matter
- **THEN** the outcome is not always the same

### Requirement: The match ends when both hands are empty

A match SHALL end when neither player has a card left in hand — eighteen cards placed across
twenty-five cells, leaving seven cells empty. The match SHALL NOT end on any count of placed cards
short of that. When the match ends, the player with the higher score wins; equal scores are a draw.
The final board SHALL remain visible with the result.

#### Scenario: The match runs until both hands are empty

- **WHEN** cards have been placed but at least one player still holds a card
- **THEN** the match continues

#### Scenario: The match ends with seven cells empty

- **WHEN** the eighteenth card is placed
- **THEN** the match ends
- **AND** seven cells remain empty

#### Scenario: The higher score wins

- **WHEN** the match ends with one player's score higher than the other's
- **THEN** that player is the winner

#### Scenario: Equal scores draw

- **WHEN** the match ends with both scores at nine
- **THEN** the result is a draw

#### Scenario: The board remains visible at the end

- **WHEN** the match ends
- **THEN** the final board and both final scores remain visible alongside the result

### Requirement: Retreating abandons the match

The player SHALL be able to retreat from a match at any point. Retreating SHALL discard the match
entirely: it produces no winner, no draw, and no result, and the abandoned match SHALL NOT be
resumable. After retreating, the in-game screen SHALL no longer be reachable until a new match is
started.

#### Scenario: Retreating discards the match

- **WHEN** the player retreats mid-match
- **THEN** the match is discarded
- **AND** no winner, draw, or result is recorded

#### Scenario: A retreated match cannot be re-entered

- **WHEN** the player attempts to return to the in-game screen after retreating
- **THEN** they are sent to the Battle page instead

#### Scenario: A new match starts fresh after a retreat

- **WHEN** the player starts a match after retreating from one
- **THEN** both hands are dealt anew at nine cards
- **AND** the board is empty and both scores are nine
