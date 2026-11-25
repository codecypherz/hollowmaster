## ADDED Requirements

### Requirement: A deck holds at most two cards of four stars or more

A deck SHALL be Invalid when it holds more than two cards whose star rating is four or higher.
Repeated copies count: three copies of the same four-star card break the limit. Both the star
threshold (four) and the number of such cards allowed (two) SHALL be stated in exactly one place,
and the standing, its message, and battle eligibility SHALL all derive from that statement.

When the standing reports Invalid, it SHALL say which rule was broken and how many cards over the
limit the deck is, so the player can be told what to remove.

#### Scenario: One high-rarity card is allowed

- **WHEN** a deck holds exactly one card of four stars
- **THEN** it is not Invalid

#### Scenario: Two high-rarity cards are allowed

- **WHEN** a deck holds exactly two cards of four stars, whether different cards or two copies of one
- **THEN** it is not Invalid

#### Scenario: Three high-rarity cards break the limit

- **WHEN** a deck holds three different cards of four stars
- **THEN** it is Invalid
- **AND** the standing says the deck holds three cards of four stars or more, where two are
  allowed

#### Scenario: Three copies of one card break the limit

- **WHEN** a deck holds three copies of the same four-star card
- **THEN** it is Invalid

#### Scenario: Ratings above four count toward the limit

- **WHEN** a deck holds two four-star cards and one card rated five or six stars
- **THEN** it is Invalid

#### Scenario: Ratings below four never count

- **WHEN** a deck holds nine cards of three stars or fewer
- **THEN** it is not Invalid

## MODIFIED Requirements

### Requirement: A deck's standing is derived from its contents

Every deck SHALL have a standing that is worked out from the cards it holds and nothing else. The
standing SHALL report each of the deck's problems:

- **Invalid**: the deck breaks the rarity limit.
- **Incomplete**: the deck holds fewer than the full nine cards.

A deck with neither problem SHALL be **Ready**. A deck MAY be Invalid and Incomplete at once, and
then both problems SHALL be reported. Invalid SHALL rank above Incomplete as the more serious
problem.

The standing SHALL NOT be stored: it MUST NOT appear in the persisted user, and it MUST be the same
whenever the same contents are evaluated.

#### Scenario: A full deck within the limit is ready

- **WHEN** a deck holds nine cards, at most two of which have four stars or more
- **THEN** its standing is Ready
- **AND** no problem is reported

#### Scenario: A short deck is incomplete

- **WHEN** a deck holds five cards, none of which has four stars or more
- **THEN** its standing reports Incomplete
- **AND** it reports that four more cards are needed
- **AND** it does not report Invalid

#### Scenario: An empty deck is incomplete

- **WHEN** a deck holds no cards
- **THEN** its standing reports Incomplete, needing nine cards
- **AND** it does not report Invalid

#### Scenario: Both problems are reported together

- **WHEN** a deck holds six cards, three of which have four stars
- **THEN** its standing reports both Invalid and Incomplete
- **AND** Invalid is ranked first

#### Scenario: The standing is not persisted

- **WHEN** a user holding decks of every standing is persisted and read back
- **THEN** the persisted user carries no standing for any deck
- **AND** each deck's standing, worked out again, is unchanged

### Requirement: The rarity limit does not refuse an addition

Adding a card that would make a deck Invalid SHALL NOT be refused for that reason. The limit governs
the deck's standing, not what deck editing allows. A deck operation SHALL still be refused only for
the reasons already stated: no such deck, a full deck, an unowned card, more copies of a card than
are held, or a position no card occupies. The player SHALL always be able to make an Invalid deck
valid again by removing cards.

#### Scenario: A second four-star card is accepted

- **WHEN** a four-star card is added to a deck that holds exactly one card of four stars or more,
  a different one, and the deck has a free position
- **THEN** the addition succeeds
- **AND** the deck does not become Invalid

#### Scenario: A third four-star card is accepted

- **WHEN** a four-star card is added to a deck that already holds two other four-star cards, and the
  deck has a free position
- **THEN** the addition succeeds
- **AND** the deck's standing becomes Invalid

#### Scenario: Removal restores validity

- **WHEN** one of the three four-star cards is removed from an Invalid deck
- **THEN** the deck is no longer Invalid

## REMOVED Requirements

### Requirement: A deck holds at most one card of four stars or more

**Reason**: The limit is now two, so the requirement's name and the scenarios in which two cards break
it no longer hold. "A deck holds at most two cards of four stars or more" replaces it.

**Migration**: None. The standing is derived from a deck's contents, so a stored deck holding two such
cards stops being Invalid the next time it is evaluated.
