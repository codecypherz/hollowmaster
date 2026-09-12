## MODIFIED Requirements

### Requirement: The Shop shows the player's Geo purse

The Shop SHALL display the player's current Geo balance whenever the page is shown, rendered as a Geo
amount — the balance followed by the Geo mark — so the currency is named by its mark rather than by
the word. The displayed balance SHALL reflect the user's actual balance and SHALL update as soon as
that balance changes.

#### Scenario: The purse is visible on arrival

- **WHEN** the player navigates to the Shop
- **THEN** their Geo balance is shown, followed by the Geo mark

#### Scenario: The purse does not spell the currency

- **WHEN** the purse is rendered
- **THEN** the word "Geo" does not appear beside the balance

#### Scenario: The purse follows a purchase

- **WHEN** the player buys a pack
- **THEN** the displayed balance falls by that pack's price without the page being reloaded

#### Scenario: A zero balance is shown as zero

- **WHEN** a new player with no Geo views the Shop
- **THEN** the purse shows zero rather than being hidden or left blank

### Requirement: All three pack tiers are presented as wares

The Shop SHALL present each of the three pack tiers as a single vertical column — the sealed pack
itself, then the control that buys it — with no frame or border drawn around that column. The three
SHALL be presented together, in ascending order of price.

A tier's name SHALL be the one printed on its wrapper; the Shop MUST NOT set the name above, below, or
beside the pack. A ware MUST NOT carry explanatory copy about what the pack contains: not how many
cards it holds, and not its rarity odds. The artwork and the printed name are what distinguish one
tier from another on the storefront.

#### Scenario: The three tiers are on offer

- **WHEN** the player views the Shop
- **THEN** Level 1, Level 2, and Level 3 packs are all presented
- **AND** each is shown as a sealed pack carrying its own name, with its price on the control that buys it

#### Scenario: A ware is a bare column

- **WHEN** a pack tier is presented
- **THEN** the sealed pack and its control read as one vertical column
- **AND** no border or frame is drawn around them

#### Scenario: The name is on the wrapper, not on the page

- **WHEN** a pack tier is presented
- **THEN** its name appears printed on the wrapper
- **AND** no separate name is set outside the pack

#### Scenario: The wares carry no explanatory copy

- **WHEN** the player views the Shop
- **THEN** no ware states how many cards a pack holds, nor the probability of any rarity

#### Scenario: The tiers read in price order

- **WHEN** the packs are presented
- **THEN** they appear in ascending order of price

### Requirement: A pack the player cannot afford cannot be bought

A pack whose price exceeds the player's Geo balance SHALL be presented as unaffordable and SHALL
NOT be purchasable — by pointer, by keyboard, or by any other means the screen offers. The reason
SHALL be evident from the screen rather than only on attempting the purchase.

An unaffordable pack SHALL still show its price. Where an affordable pack carries its price on the
control that buys it, an unaffordable one SHALL carry that same price on an inert plate in its place,
so that what the pack costs is visible whether or not the player can pay it.

#### Scenario: An unaffordable pack is marked and inert

- **WHEN** the player's balance is below a pack's price
- **THEN** that pack is visibly marked as unaffordable
- **AND** activating it neither opens a pack nor changes the balance

#### Scenario: The price is shown even when out of reach

- **WHEN** a pack the player cannot afford is presented
- **THEN** its price is shown as a Geo amount
- **AND** that price is not a control

#### Scenario: A pack becomes buyable when the balance reaches its price

- **WHEN** the player's balance rises to at least a pack's price
- **THEN** that pack becomes purchasable without the page being reloaded

#### Scenario: Affordability is stated per pack

- **WHEN** the player can afford Level 1 but not Level 3
- **THEN** Level 1 is purchasable and Level 3 is marked unaffordable

### Requirement: The opening can be skipped and yields the same result

The player SHALL be able to end the opening early, and doing so SHALL show the full result at once.
The control SHALL be available for the opening's whole duration, including while the pack is still
sealed. Skipping SHALL change nothing about what was drawn: the same five cards are granted whether
the sequence was watched or skipped, and the purchase is settled at the moment of buying rather than
at the end of the animation.

#### Scenario: Skipping shows the whole result

- **WHEN** the player skips partway through an opening
- **THEN** all five cards are shown immediately

#### Scenario: Skipping a sealed pack shows the result

- **WHEN** the player skips before the pack has torn open
- **THEN** all five cards are shown immediately
- **AND** no further stage of the sequence plays

#### Scenario: Skipping does not change the draw

- **WHEN** the player skips an opening
- **THEN** the cards granted are the same five that were drawn

#### Scenario: Leaving mid-opening does not forfeit the pack

- **WHEN** the player navigates away before the opening finishes
- **THEN** the Geo is still spent and the five cards are still in their collection

### Requirement: The opening honours a reduced-motion preference

Where the player has asked for reduced motion, the opening SHALL present its result without the
animated sequence — the pack is not shown tearing, and the five cards appear in their common-to-rare
order without travel, flourish, or staged timing. No information conveyed by the animation MUST be
available only through it.

#### Scenario: Reduced motion collapses the sequence

- **WHEN** the player has requested reduced motion and buys a pack
- **THEN** the five cards are presented without animated arrival

#### Scenario: Reduced motion does not play the tear

- **WHEN** the player has requested reduced motion and buys a pack
- **THEN** the opening does not animate the pack tearing

#### Scenario: Nothing is lost with motion removed

- **WHEN** the opening is presented under reduced motion
- **THEN** the same five cards, in the same order, with the same rarity emphasis, are discernible

### Requirement: The opening fits the viewport

The opening SHALL be fully visible within the viewport for its whole duration — while the pack is
sealed, during the staged reveal, and in the five-card summary that follows — without clipping the
pack or a card, producing a scrollbar, or pushing the storefront out from under it.

#### Scenario: The sealed pack fits at a range of viewport sizes

- **WHEN** a pack is opened at viewport sizes from a large desktop down to a small laptop
- **THEN** the sealed pack is fully visible and no scrollbar appears
- **AND** it is laid out at or above the pack's minimum supported width

#### Scenario: The reveal fits at a range of viewport sizes

- **WHEN** a pack is opened at viewport sizes from a large desktop down to a small laptop
- **THEN** every revealed card is fully visible and no scrollbar appears

#### Scenario: Returning to the storefront restores the page

- **WHEN** the player closes the opening
- **THEN** the storefront is shown intact, with the updated purse

## ADDED Requirements

### Requirement: The control that buys a pack is its price

The control that buys a pack SHALL be labelled with that pack's price, rendered as a Geo amount, and
with nothing else. The Shop MUST NOT present a separate purchase label such as "Buy", and MUST NOT
state the price a second time outside that control.

#### Scenario: The button is the price

- **WHEN** a pack the player can afford is presented
- **THEN** the control that buys it is labelled with its price followed by the Geo mark

#### Scenario: There is no second purchase label

- **WHEN** the player views the Shop
- **THEN** no control is labelled "Buy"

#### Scenario: The price is stated once

- **WHEN** a pack is presented
- **THEN** its price appears exactly once on that ware

#### Scenario: The price control buys that pack

- **WHEN** the player activates a pack's price control
- **THEN** that pack is bought, its price is deducted, and its opening begins

### Requirement: The opening begins on the sealed pack

An opening SHALL begin with the bought pack shown sealed, rendered as the same pack the storefront
sold. That pack SHALL then tear open, and only after it has torn SHALL the first card be revealed.
The torn pack is what the cards come out of, so the player sees the thing they bought being opened
rather than cards appearing from nowhere.

#### Scenario: The pack is shown before any card

- **WHEN** an opening begins
- **THEN** the bought pack is shown sealed
- **AND** no card is visible yet

#### Scenario: The pack shown is the pack bought

- **WHEN** a Level 3 pack is opened
- **THEN** the pack shown is the Level 3 wrapper, with the same artwork and printed name the storefront showed

#### Scenario: The tear precedes the first reveal

- **WHEN** the sealed pack tears open
- **THEN** the first card begins its reveal after the tear rather than before it

#### Scenario: The sealed stage is brief

- **WHEN** an opening begins
- **THEN** the pack tears without the player having to act
- **AND** the wait before the first card is short enough that the opening does not stall
