## ADDED Requirements

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

- **WHEN** a deck holds nine cards, at most one of which has four stars or more
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

- **WHEN** a deck holds six cards, two of which have four stars
- **THEN** its standing reports both Invalid and Incomplete
- **AND** Invalid is ranked first

#### Scenario: The standing is not persisted

- **WHEN** a user holding decks of every standing is persisted and read back
- **THEN** the persisted user carries no standing for any deck
- **AND** each deck's standing, worked out again, is unchanged

### Requirement: A deck holds at most one card of four stars or more

A deck SHALL be Invalid when it holds more than one card whose star rating is four or higher.
Repeated copies count: two copies of the same four-star card break the limit. Both the star
threshold (four) and the number of such cards allowed (one) SHALL be stated in exactly one place,
and the standing, its message, and battle eligibility SHALL all derive from that statement.

When the standing reports Invalid, it SHALL say which rule was broken and how many cards over the
limit the deck is, so the player can be told what to remove.

#### Scenario: One high-rarity card is allowed

- **WHEN** a deck holds exactly one card of four stars
- **THEN** it is not Invalid

#### Scenario: Two high-rarity cards break the limit

- **WHEN** a deck holds two different cards of four stars
- **THEN** it is Invalid
- **AND** the standing says the deck holds two cards of four stars or more, where one is allowed

#### Scenario: Two copies of one card break the limit

- **WHEN** a deck holds two copies of the same four-star card
- **THEN** it is Invalid

#### Scenario: Ratings above four count toward the limit

- **WHEN** a deck holds one four-star card and one card rated five or six stars
- **THEN** it is Invalid

#### Scenario: Ratings below four never count

- **WHEN** a deck holds nine cards of three stars or fewer
- **THEN** it is not Invalid

### Requirement: The rarity limit does not refuse an addition

Adding a card that would make a deck Invalid SHALL NOT be refused for that reason. The limit governs
the deck's standing, not what deck editing allows. A deck operation SHALL still be refused only for
the reasons already stated: no such deck, a full deck, an unowned card, or a position no card
occupies. The player SHALL always be able to make an Invalid deck valid again by removing cards.

#### Scenario: A second four-star card is accepted

- **WHEN** a card of four stars is added to a deck that already holds one, and the deck has a free
  position
- **THEN** the addition succeeds
- **AND** the deck's standing becomes Invalid

#### Scenario: Removal restores validity

- **WHEN** one of the two four-star cards is removed from an Invalid deck
- **THEN** the deck is no longer Invalid

### Requirement: Only a ready deck is eligible for battle

A deck SHALL be eligible to be taken into battle only when its standing is Ready. Both an Invalid
deck and an Incomplete deck SHALL be ineligible. Eligibility SHALL be read from the deck's standing,
not decided separately, so that any surface offering a choice of deck for battle withholds exactly
the decks the standing reports a problem for.

#### Scenario: A ready deck is eligible

- **WHEN** a deck's standing is Ready
- **THEN** it is eligible for battle

#### Scenario: An invalid deck is not eligible

- **WHEN** a deck's standing reports Invalid, whether or not it is also Incomplete
- **THEN** it is not eligible for battle

#### Scenario: An incomplete deck is not eligible

- **WHEN** a deck's standing reports Incomplete only
- **THEN** it is not eligible for battle

#### Scenario: A new player has no eligible deck

- **WHEN** a user created with no prior data is read
- **THEN** their one seeded deck is Incomplete
- **AND** they hold no deck eligible for battle
