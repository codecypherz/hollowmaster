## ADDED Requirements

### Requirement: A record written against the first catalogue is renumbered on load

The catalogue's numbering SHALL be part of what a stored record's version identifies. Records
written before the catalogue was renumbered — every version up to and including the one that added
the remembered battle deck — SHALL have each card they name translated from its first-catalogue
number to the number the same card carries now, where "the same card" is the card of the same name.
The translation SHALL apply to collection entries and to deck positions alike, and SHALL happen
before any other load rule (unknown-card dropping, copy limits, deck limits) is applied, so those
rules judge the translated cards. A first-catalogue number with no translation SHALL be treated as
a card the catalogue no longer contains. A record at the current version SHALL NOT be translated.
The upgraded record SHALL be rewritten at the current version, so a further reload restores it
directly and is never translated twice.

The first catalogue's cards and their current numbers are:

| First-catalogue number | Card            | Current number |
| ---------------------- | --------------- | -------------- |
| FC#1                   | Crawlid         | FC#1           |
| FC#2                   | Gruz Mother     | FC#6           |
| FC#3                   | Vengefly King   | FC#4           |
| FC#4                   | Aspid Hunter    | FC#7           |
| FC#5                   | Aspid Mother    | FC#8           |
| FC#6                   | Goam            | FC#10          |
| FC#7                   | Vengefly        | FC#3           |
| FC#8                   | Gruzzer         | FC#5           |
| FC#9                   | Tiktik          | FC#2           |
| FC#10                  | Aspid Hatchling | FC#9           |
| FC#11                  | Wandering Husk  | FC#11          |
| FC#12                  | Husk Hornhead   | FC#12          |
| FC#13                  | Leaping Husk    | FC#13          |
| FC#14                  | Husk Bully      | FC#14          |
| FC#15                  | Husk Warrior    | FC#15          |

#### Scenario: A player keeps the cards they owned

- **WHEN** a record written before the renumbering holds two copies of `FC#2` (Gruz Mother) and one
  of `FC#9` (Tiktik)
- **THEN** the restored collection holds two Gruz Mother (`FC#6`) and one Tiktik (`FC#2`)
- **AND** it holds no other card

#### Scenario: A deck keeps its cards and their order

- **WHEN** a record written before the renumbering holds a deck naming `FC#6`, `FC#1`, `FC#7` in
  that order, and the collection holding each of them
- **THEN** the restored deck holds Goam, Crawlid, and Vengefly (`FC#10`, `FC#1`, `FC#3`) in that
  order

#### Scenario: Every earlier version is renumbered

- **WHEN** a record of any recognised version earlier than the current one names `FC#7`
- **THEN** the restored user holds Vengefly, not the card now numbered 7

#### Scenario: A current record is read as written

- **WHEN** a record at the current version names `FC#7`
- **THEN** the restored user holds Aspid Hunter, the card now numbered 7

#### Scenario: An untranslatable number is dropped

- **WHEN** a record written before the renumbering names `FC#16`
- **THEN** that entry is dropped and the rest of the record is restored

#### Scenario: An upgraded record is not translated twice

- **WHEN** a record written before the renumbering is loaded and the application is reloaded
- **THEN** the stored record carries the current version
- **AND** the second load restores the same cards as the first

#### Scenario: Balances and milestones survive the renumbering

- **WHEN** a record written before the renumbering is loaded
- **THEN** its Geo, its Rosaries, its milestones, and its remembered battle deck are restored as
  they would have been without the renumbering
