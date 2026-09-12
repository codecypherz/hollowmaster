## Purpose

Defines what a pack of cards is — the tiers a player can buy, what each costs, how many cards each
yields, and the per-rarity odds that distinguish one tier from another — so that a pack's contents
are governed by declared data that can be tuned and verified rather than by logic scattered through
the screen that sells it.

## Requirements

### Requirement: A card's rarity is its star rating

A card's rarity SHALL be its star rating as defined by the card data model — a whole number from 1
to 6, where 1 is the most common and 6 the rarest. No separate rarity property MUST be introduced,
and no pack behaviour MUST depend on any other card property to decide how rare a card is.

#### Scenario: Rarity is read from the card

- **WHEN** a card's rarity is needed
- **THEN** its star rating is used
- **AND** no other property of the card is consulted

#### Scenario: The rarity scale spans the star range

- **WHEN** the set of rarities a pack can weight is read
- **THEN** it is exactly the six star ratings 1 through 6

### Requirement: Three pack tiers are offered

Exactly three pack tiers SHALL exist, named **Level 1**, **Level 2**, and **Level 3**. Each tier
SHALL declare a display name, a price in Geo, and its per-rarity odds. Prices SHALL rise strictly
with the tier: Level 1 costs less than Level 2, which costs less than Level 3.

#### Scenario: The three tiers are available

- **WHEN** the pack catalogue is read
- **THEN** exactly three tiers are offered, named Level 1, Level 2, and Level 3

#### Scenario: Each tier states its price

- **WHEN** a tier is read
- **THEN** it carries a price in Geo that is a whole number greater than zero

#### Scenario: Prices rise with the tier

- **WHEN** the three prices are compared
- **THEN** Level 1's price is less than Level 2's, and Level 2's is less than Level 3's

### Requirement: Every pack contains exactly five cards

Opening a pack of any tier SHALL yield exactly five cards. The count MUST NOT vary by tier, by
price, or by the outcome of the draw.

#### Scenario: A pack yields five cards

- **WHEN** a pack of any tier is opened
- **THEN** exactly five cards are produced

#### Scenario: A short catalogue still fills a pack

- **WHEN** a pack is opened against a catalogue holding fewer than five cards
- **THEN** five cards are still produced

### Requirement: Every pack tier declares a positive weight for every rarity

Each tier SHALL declare a weight for each of the six rarities, stated as data in one place. Every
weight SHALL be greater than zero, so that **every pack can yield every card** — the tiers differ
only in how likely each rarity is, never in which rarities are reachable.

#### Scenario: Each tier weights all six rarities

- **WHEN** a tier's odds are read
- **THEN** a weight is stated for each of the six rarities
- **AND** every one of those weights is greater than zero

#### Scenario: The rarest cards are reachable from the cheapest pack

- **WHEN** enough Level 1 packs are opened against a catalogue containing a six-star card
- **THEN** that card can be drawn

#### Scenario: The odds live in one declared place

- **WHEN** a tier's odds are changed
- **THEN** only the declared weight data changes
- **AND** no drawing, pricing, or presentation logic is edited to match

### Requirement: Higher tiers weight rarity more heavily

The three weight tables SHALL form a ladder. For every rarity, its weight SHALL be monotone across
the tiers — never increasing as the tier rises, or never decreasing, but not both. The **expected
rarity of a drawn card** SHALL strictly increase from Level 1 to Level 2 to Level 3, and the
probability of drawing a card of rarity 4 or higher SHALL likewise strictly increase with the tier.

#### Scenario: Expected rarity rises with the tier

- **WHEN** the expected rarity of a card drawn from each tier is computed from its weights
- **THEN** Level 1's is lower than Level 2's, and Level 2's is lower than Level 3's

#### Scenario: High-rarity odds rise with the tier

- **WHEN** the chance of drawing a card of rarity 4 or higher is computed for each tier
- **THEN** it is lowest for Level 1 and highest for Level 3

#### Scenario: Common odds fall with the tier

- **WHEN** the chance of drawing a one-star card is computed for each tier
- **THEN** it is highest for Level 1 and lowest for Level 3

#### Scenario: No rarity's weight moves in both directions

- **WHEN** a single rarity's weight is compared across the three tiers in order
- **THEN** the three values are non-increasing, or they are non-decreasing

### Requirement: A rarity the catalogue cannot supply is redistributed

Where a tier weights a rarity for which the catalogue holds no card, that weight SHALL be removed
and the remaining weights SHALL be rescaled in proportion, preserving their relative odds. A draw
MUST NOT fail, stall, or return nothing because a weighted rarity is unrepresented.

#### Scenario: An unrepresented rarity is dropped from the odds

- **WHEN** a pack is drawn against a catalogue holding no five-star and no six-star cards
- **THEN** every card drawn has a rarity the catalogue can supply
- **AND** the drawn rarities remain in the same proportion to one another as their declared weights

#### Scenario: A catalogue of one rarity still yields a pack

- **WHEN** a pack is drawn against a catalogue whose cards are all one-star
- **THEN** five one-star cards are produced

#### Scenario: Redistribution does not alter the declared table

- **WHEN** a draw redistributes weight away from an unrepresented rarity
- **THEN** the declared weight data is unchanged for the next draw

### Requirement: Draws within a pack are independent

The five cards in a pack SHALL each be drawn independently: a rarity is chosen against the tier's
effective weights and a card of that rarity is chosen from the catalogue. A pack MAY therefore
contain the same card more than once, and MAY contain five cards of the same rarity.

#### Scenario: A pack may repeat a card

- **WHEN** many packs are drawn against a small catalogue
- **THEN** packs containing the same card twice occur

#### Scenario: Earlier draws do not constrain later ones

- **WHEN** a pack's first card is drawn at a given rarity
- **THEN** the remaining four draws use the same effective weights as the first

#### Scenario: Cards of a rarity are equally likely

- **WHEN** a rarity is drawn and the catalogue holds several cards at that rarity
- **THEN** each of those cards is equally likely to be the one produced

### Requirement: A pack's contents are ordered from most common to most rare

A pack SHALL present its five cards in ascending order of rarity, so that the most common card comes
first and the rarest last. Cards of equal rarity SHALL keep the order they were drawn in, so the
ordering is stable.

#### Scenario: A pack is ordered by rarity

- **WHEN** a pack containing cards of rarities 3, 1, 4, 1, and 2 is read
- **THEN** they are presented in the order 1, 1, 2, 3, 4

#### Scenario: Equal rarities keep their draw order

- **WHEN** a pack contains two different cards of the same rarity
- **THEN** the one drawn first is presented first

#### Scenario: An all-one-rarity pack keeps its draw order

- **WHEN** every card in a pack shares a rarity
- **THEN** the pack is presented in the order the cards were drawn

### Requirement: A draw is reproducible from its source of randomness

Drawing a pack SHALL take its randomness from a supplied source rather than reaching for one
itself, so that the same tier drawn against the same catalogue with the same sequence of random
values produces the same five cards. This makes the declared odds verifiable.

#### Scenario: The same randomness yields the same pack

- **WHEN** a tier is drawn twice against the same catalogue with the same sequence of random values
- **THEN** both draws produce identical cards in identical order

#### Scenario: The odds can be measured

- **WHEN** a large number of packs of one tier are drawn
- **THEN** the observed distribution of rarities converges on that tier's effective weights
