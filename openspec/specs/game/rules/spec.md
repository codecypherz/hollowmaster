## Purpose

Defines the rules of a Hollow Master match — the board's dimensions, how each player's hand is
dealt, whose turn it is, how a placed card captures its neighbours, how score is counted, and when
and how a match concludes — so that the rules are one stated contract rather than a set of literals
inside whatever code happens to implement them.

## Requirements

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

At the start of a match each player SHALL hold a hand of nine cards. The player's hand SHALL be the
nine cards of the deck chosen for that battle: hand slot one holds the deck's first card, and so on
in deck order. The opponent's hand SHALL be a deck drawn from the card database that satisfies the
same deck-building rules the player's deck is held to. It SHALL be a full deck of nine cards that
violates no rule, including the rarity limit, so that judged as a deck it is Ready. The opponent's
hand SHALL NOT be an unconstrained draw from the database. A match SHALL NOT be started for a deck
that is not eligible for battle. A hand slot SHALL keep its position for the whole match: playing
the card in a slot empties that slot rather than shifting the remaining cards.

#### Scenario: Both hands start at nine

- **WHEN** a match begins
- **THEN** the player's hand holds nine cards
- **AND** the opponent's hand holds nine cards

#### Scenario: The player's hand is the chosen deck in order

- **WHEN** a match begins with a Ready deck
- **THEN** the player's nine hand slots hold that deck's nine cards in deck order, duplicates
  included

#### Scenario: The opponent is dealt from the card database

- **WHEN** a match begins
- **THEN** the opponent's hand is drawn from the card database and not from the player's deck

#### Scenario: The opponent's hand obeys the rarity limit

- **WHEN** any number of matches are begun
- **THEN** in every one, the opponent's hand holds no more cards at or above the rarity limit's
  star threshold than the rarity limit allows

#### Scenario: The opponent's hand would be a Ready deck

- **WHEN** the opponent's nine dealt cards are judged as a deck by the deck-building rules
- **THEN** the deck's standing reports no problem

#### Scenario: An ineligible deck starts no match

- **WHEN** a match is asked to begin with a deck that is Invalid or Incomplete
- **THEN** no match is started

#### Scenario: A played card leaves its slot empty

- **WHEN** a player plays the card in a given hand slot
- **THEN** that slot becomes empty
- **AND** every other card in the hand remains in the slot it occupied

### Requirement: The deal permits duplicate cards

The deal SHALL NOT require the eighteen dealt cards to be distinct. The same card from the database
MAY appear more than once within a hand and MAY appear in both hands in the same match. The
opponent's deal SHALL succeed for any card database holding at least one card rated below the
rarity limit's star threshold, because such a card can fill every position the rarity limit closes
to rarer cards.

#### Scenario: The deal succeeds with fewer than eighteen distinct cards

- **WHEN** a match is dealt from a card database holding fewer than eighteen cards, at least one of
  them below the rarity threshold
- **THEN** both hands are filled to nine cards
- **AND** the deal does not fail, truncate a hand, or leave a hand slot empty

#### Scenario: The deal succeeds from a single common card

- **WHEN** the opponent is dealt from a card database holding exactly one card, rated below the
  rarity threshold
- **THEN** the opponent's hand is nine copies of that card

#### Scenario: A duplicated card is an independent card in play

- **WHEN** the same card is dealt into two hand slots
- **THEN** each is played, captured, and scored independently of the other
- **AND** playing one does not affect the other

#### Scenario: Hands vary between matches

- **WHEN** two matches are dealt in succession
- **THEN** the opponent's hands are not required to be identical between them

### Requirement: A player's score is the number of cards they own on the board

A player's score SHALL be the count of cards that player owns on the board. Cards remaining in that
player's hand SHALL NOT count towards their score. The two players' scores SHALL therefore always
sum to the number of cards placed on the board, reaching eighteen only once both hands are empty.

#### Scenario: Scores start at nothing apiece

- **WHEN** a match begins and no card has been played
- **THEN** each player's score is zero

#### Scenario: Playing a card raises the player's score by one

- **WHEN** a player plays a card from hand to the board and captures nothing
- **THEN** their score rises by one
- **AND** the opponent's score is unchanged

#### Scenario: A capture moves one point

- **WHEN** a placement captures one of the opponent's cards
- **THEN** the capturing player's score rises by one
- **AND** the captured player's score falls by one

#### Scenario: The scores sum to the cards played

- **WHEN** the score is read at any point in a match
- **THEN** the two scores sum to the number of cards on the board

### Requirement: Turns alternate, beginning with the lighter deck's opponent

Each deck's star total SHALL be the sum of the rarity stars on its nine cards. The player whose
deck has the smaller star total SHALL take the second turn, and the other player SHALL take the
first. When the two totals are equal, who moves first SHALL be decided by a fair coin flip. After
the first turn, turns SHALL alternate between the player and the opponent. A player SHALL be able
to act only on their own turn. The opponent's turn SHALL be taken automatically without the player
acting, including when the opponent moves first.

#### Scenario: The heavier deck moves first

- **WHEN** a match begins and the player's deck holds more stars in total than the opponent's
- **THEN** it is the player's turn
- **AND** the opponent has placed no card

#### Scenario: The lighter deck moves second

- **WHEN** a match begins and the player's deck holds fewer stars in total than the opponent's
- **THEN** the opponent takes the first turn without the player acting
- **AND** the player's first turn follows the opponent's first placement

#### Scenario: Equal totals are a coin flip

- **WHEN** many matches begin with the two decks' star totals equal
- **THEN** sometimes the player moves first and sometimes the opponent does
- **AND** neither outcome is favoured

#### Scenario: The turn passes after a placement resolves

- **WHEN** a player's placement and all of its combats and captures have resolved
- **THEN** the turn passes to the other player

#### Scenario: The player cannot act out of turn

- **WHEN** it is the opponent's turn
- **THEN** the player cannot select or place a card
- **AND** an attempt to do so changes nothing about the match

### Requirement: A card may be placed only in an empty cell on its owner's turn

A placement SHALL be accepted only when it is the placing player's turn, the placing player has
selected a card in their own hand, the target cell is empty, and no combat from the previous
placement is still waiting for its order to be chosen. A placement failing any of these SHALL leave
the match state entirely unchanged.

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

#### Scenario: No placement while a combat order is pending

- **WHEN** the player's last placement is waiting for them to choose which combat to fight next
- **THEN** no card can be selected or placed until every combat of that placement has resolved

### Requirement: Only the card just played attacks

The only attacks in a turn SHALL come from the card placed that turn. For each chevron of the
placed card that points at an adjacent cell holding a card owned by the other player, that card is
a **target**. A target SHALL be a **combat** target when it has a chevron pointing back at the
placed card's cell, and a **defenseless** target when it does not. No other card on the board SHALL
attack in that turn: a card that already sits on the board never initiates an attack, whatever its
chevrons point at, and neither does a card taken during the turn.

#### Scenario: A chevron meeting a returning chevron is a combat

- **WHEN** a placed card's chevron points at an adjacent opposing card whose own chevron points
  back at the placed card
- **THEN** that card is a combat target

#### Scenario: A chevron meeting no returning chevron is defenseless

- **WHEN** a placed card's chevron points at an adjacent opposing card with no chevron pointing
  back
- **THEN** that card is a defenseless target

#### Scenario: A neighbour pointing in without being pointed at is untouched

- **WHEN** an adjacent opposing card has a chevron pointing at the placed card but the placed card
  has no chevron pointing at it
- **THEN** that card is neither attacked nor attacks
- **AND** its ownership does not change

#### Scenario: A friendly neighbour is never a target

- **WHEN** a placed card's chevron points at an adjacent cell holding a card the placing player
  already owns
- **THEN** that card is not a target

#### Scenario: A chevron at the board edge targets nothing

- **WHEN** a card is placed in an edge or corner cell with chevrons pointing off the board
- **THEN** those chevrons target nothing
- **AND** the placement resolves normally for the chevrons that remain on the board

### Requirement: A defenseless target is taken without a roll

A defenseless target SHALL be taken by the placing player automatically, with no roll. Taking a
defenseless target SHALL NOT trigger a combo.

#### Scenario: A defenseless target is always taken

- **WHEN** a placement's combats have all been won, or there were none, and a defenseless target
  remains
- **THEN** that target changes to the placing player's ownership
- **AND** no roll is made for it

#### Scenario: A defenseless capture does not spread

- **WHEN** a defenseless target is taken and its own chevrons point at further opposing cards
- **THEN** those cards do not change ownership because of it

### Requirement: Combat powers are rolled from a band table

In a combat, the attacker's power SHALL be derived from its attack stat and the defender's power
from its defense stat. Each side's power SHALL come from a uniformly random whole number from 1 to
100 inclusive, read against this table:

| Roll    | Effect                       |
| ------- | ---------------------------- |
| 100     | that side wins outright      |
| 95 – 99 | stat +20%                    |
| 85 – 94 | stat +15%                    |
| 70 – 84 | stat +10%                    |
| 51 – 69 | stat +5%                     |
| 32 – 50 | stat −5%                     |
| 17 – 31 | stat −10%                    |
| 7 – 16  | stat −15%                    |
| 2 – 6   | stat −20%                    |
| 1       | that side loses outright     |

A modified power SHALL be the stat scaled by its band's percentage and rounded to the nearest whole
number, with halves rounding up. The table's bands SHALL be stated in exactly one place.

#### Scenario: Every roll from 1 to 100 falls in exactly one band

- **WHEN** each whole number from 1 to 100 is read against the table
- **THEN** each falls in exactly one band
- **AND** no number outside 1 to 100 is ever rolled

#### Scenario: A mid-band roll scales the stat

- **WHEN** a card with attack 40 attacks and rolls 90
- **THEN** its attack power is 46

#### Scenario: A low roll shrinks the stat

- **WHEN** a card with defense 30 defends and rolls 20
- **THEN** its defense power is 27

#### Scenario: Band edges are exact

- **WHEN** rolls of 95, 94, 85, 84, 70, 69, 51, 50, 32, 31, 17, 16, 7, 6, and 2 are read
- **THEN** they give +20%, +15%, +15%, +10%, +10%, +5%, +5%, −5%, −5%, −10%, −10%, −15%, −15%,
  −20%, and −20% respectively

### Requirement: A combat is won by the higher power, with ties to the defender

A combat SHALL be decided as follows, in this order:

1. If both sides rolled 100, or both rolled 1, the defender wins.
2. A side that rolled 100 wins, and a side that rolled 1 loses.
3. Otherwise, the attacker wins only when its power is strictly greater than the defender's power.
   Equal powers go to the defender.

#### Scenario: The attacker's 100 wins

- **WHEN** the attacker rolls 100 and the defender rolls anything from 1 to 99
- **THEN** the attacker wins

#### Scenario: The defender's 100 wins

- **WHEN** the defender rolls 100 and the attacker rolls anything from 1 to 99
- **THEN** the defender wins

#### Scenario: A 1 loses whatever the stats

- **WHEN** one side rolls 1 and the other rolls anything from 2 to 100
- **THEN** the side that rolled 1 loses, however its stat compares to the other's

#### Scenario: Matching extremes go to the defender

- **WHEN** both sides roll 100, or both sides roll 1
- **THEN** the defender wins

#### Scenario: Equal powers go to the defender

- **WHEN** neither side rolled 1 or 100 and the attack power equals the defense power
- **THEN** the defender wins

#### Scenario: The stronger power wins

- **WHEN** neither side rolled 1 or 100 and the attack power exceeds the defense power by any
  amount
- **THEN** the attacker wins

### Requirement: Each card rolls at most once per turn, and attack power wears down

A card SHALL roll at most once in a turn. The attacker SHALL roll when it fights its first combat
of the turn and SHALL carry the result through every later combat of that turn. After the attacker
beats a defender, its power for its next combat SHALL be its current power minus that defender's
defense power. An attacker that rolled 100 SHALL win every combat it fights that turn, except
against a defender that also rolls 100. A defender that rolled 1 SHALL take nothing off the
attacker's power.

#### Scenario: One roll serves several combats

- **WHEN** a placed card fights two combats in one turn
- **THEN** it rolls once
- **AND** each defender rolls once

#### Scenario: Attack power wears down across combats

- **WHEN** a placed card wins its first combat with attack power 60 against defense power 25
- **THEN** it enters its second combat with attack power 35

#### Scenario: A worn-down attack can lose

- **WHEN** a placed card's worn-down attack power does not exceed the next defender's defense power
- **THEN** the attacker loses that combat

#### Scenario: A 100 carries through the turn

- **WHEN** an attacker that rolled 100 fights three combats and no defender rolls 100
- **THEN** the attacker wins all three

#### Scenario: A defender's 1 costs the attacker nothing

- **WHEN** an attacker with attack power 50 beats a defender that rolled 1
- **THEN** the attacker enters its next combat with attack power 50

### Requirement: Combats resolve before defenseless captures, and an attacker's loss ends the turn

Every combat target of a placement SHALL be fought before any defenseless target is taken. If the
attacker loses a combat, the turn's resolution SHALL end immediately: no further combat is fought
and no defenseless target is taken. Defenseless targets are taken only when the attacker has won
every combat of the turn, or when there were no combats.

#### Scenario: Combats come first

- **WHEN** a placed card has both combat targets and defenseless targets
- **THEN** every combat is fought before any defenseless target is taken

#### Scenario: Losing a combat forfeits the rest

- **WHEN** a placed card loses its first of two combats and also has a defenseless target
- **THEN** the second combat is not fought
- **AND** the defenseless target keeps its owner

#### Scenario: A clean sweep takes the defenseless too

- **WHEN** a placed card wins every combat it fights
- **THEN** every defenseless target that is still opposing is taken

### Requirement: The attacker's player chooses the order of several combats

When a placement has two or more combat targets still to fight, the player who placed the card
SHALL choose which one is fought next. The choice SHALL be offered again before each combat for as
long as two or more remain. When one remains, it SHALL be fought without a choice. When the player
is the attacker, the match SHALL wait for their choice, and only a remaining combat target may be
chosen. When the opponent is the attacker, it SHALL choose its own order without the player acting.

#### Scenario: The player picks the first combat

- **WHEN** the player places a card that has two combat targets
- **THEN** no combat is fought until the player chooses one of the two
- **AND** the chosen one is fought first

#### Scenario: The last combat needs no choice

- **WHEN** one combat target remains to be fought
- **THEN** it is fought without the player being asked

#### Scenario: Only a remaining target can be chosen

- **WHEN** the player is choosing the next combat and picks a cell that is not a remaining combat
  target
- **THEN** no combat is fought and the choice is still waiting

#### Scenario: The opponent orders its own combats

- **WHEN** the opponent places a card that has two or more combat targets
- **THEN** its combats are fought in an order it chooses, without the player acting

### Requirement: A card defeated in combat brings its combo

The loser of a combat SHALL be taken by the winner's owner, whether the loser was the attacker or
the defender. Every card that the loser's chevrons point at and that is owned by the player the
loser was taken from SHALL be taken by the winner's owner along with it. This is the loser's
**combo**. A combo SHALL take its cards whether or not they point back, with no roll. A combo SHALL
reach one step only: a card taken by a combo does not bring a combo of its own, and nothing else
taken in the turn does either. A combat target taken by a combo before its combat is fought SHALL
NOT be fought. A defenseless target taken by a combo is already taken and SHALL NOT count twice.

#### Scenario: A beaten defender brings its neighbours

- **WHEN** the attacker beats a defender whose chevrons point at two more of the defender's cards
- **THEN** the defender and both of those cards change to the attacker's owner

#### Scenario: A beaten attacker brings its neighbours

- **WHEN** a defender beats the attacker, and the attacker's chevrons point at cards owned by the
  attacker's player
- **THEN** the attacker and those cards change to the defender's owner

#### Scenario: A combo does not chain

- **WHEN** a card taken by a combo has chevrons pointing at further cards of the same former owner
- **THEN** those further cards do not change ownership because of it

#### Scenario: A combo can settle a pending combat

- **WHEN** a combo takes a card that was a combat target still waiting to be fought
- **THEN** that combat is not fought
- **AND** it is no longer offered as a choice

#### Scenario: A combo takes cards that would have defended

- **WHEN** a loser's chevron points at a card of its former owner that has a chevron pointing back
- **THEN** that card is taken with no roll

### Requirement: A capture changes only ownership

Every way a card changes hands (a combat loss, a combo, or a defenseless capture) SHALL change only
its owner. Each change SHALL be recorded with the placement, in the order the cards fell, together
with each combat fought and both of its rolls and powers.

#### Scenario: A taken card keeps everything but its owner

- **WHEN** a card is taken by any means
- **THEN** its owner becomes the taking player
- **AND** its name, artwork, chevrons, stars, attack, defense, ability, set, and number are
  unchanged

#### Scenario: The record follows the order of events

- **WHEN** a placement fights two combats, each with a combo, and then takes a defenseless target
- **THEN** the placement's record lists the first combat, its loser and combo, the second combat,
  its loser and combo, and the defenseless capture, in that order

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

- **WHEN** the match ends with both players owning nine cards on the board
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
- **AND** the board is empty and both scores are zero
