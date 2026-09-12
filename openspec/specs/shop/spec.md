## Purpose

Establishes the Shop as the place in the site where the player spends Geo on packs of cards — showing
their purse, offering the three pack tiers, and playing the opening that reveals what a pack held —
and as the place where power-ups and cosmetics will be sold once they exist.

## Requirements


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

### Requirement: Buying a pack spends its price and grants its cards

Buying a pack SHALL deduct exactly that pack's price from the Geo balance and add its five cards to
the player's collection, as one settled outcome. The five cards granted SHALL be exactly the five
cards the opening reveals — no more, no fewer, and not a different set.

#### Scenario: A purchase settles the balance and the collection

- **WHEN** the player buys a Level 1 pack they can afford
- **THEN** the balance falls by the Level 1 price
- **AND** the player's collection grows by five cards in total

#### Scenario: The revealed cards are the cards granted

- **WHEN** the opening finishes
- **THEN** each of the five revealed cards is held in the collection at a quantity that accounts for it

#### Scenario: Duplicates are kept, not discarded

- **WHEN** a pack yields a card the player already owns
- **THEN** that card's quantity in the collection increases

#### Scenario: The purchase survives leaving the page

- **WHEN** the player buys a pack and then reloads the application
- **THEN** the balance and the collection still reflect the purchase

### Requirement: Opening a pack reveals its cards one at a time, most common first

Buying a pack SHALL play an opening in which the five cards are revealed **one at a time**, in
ascending order of rarity, so that the rarest card of the pack is the last one shown. The opening
SHALL be animated: each card arrives through motion rather than appearing as a static list, and the
sequence SHALL make the arrival of a rarer card feel more consequential than a common one.

#### Scenario: Cards arrive one at a time

- **WHEN** a pack is opened
- **THEN** the five cards become visible one after another rather than all at once

#### Scenario: The reveal runs common to rare

- **WHEN** a pack containing cards of mixed rarity is opened
- **THEN** each revealed card's rarity is greater than or equal to the one revealed before it

#### Scenario: Rarity is felt in the reveal

- **WHEN** a card of high rarity is revealed
- **THEN** its arrival is given greater emphasis than a common card's

#### Scenario: The opening ends in a readable summary

- **WHEN** the last card has been revealed
- **THEN** all five cards are visible together
- **AND** a control returns the player to the storefront

### Requirement: Revealed cards render through the shared card renderer at a readable width

Every card shown during and after an opening SHALL be rendered by the shared card component and
SHALL obey the card design contract. Each revealed card SHALL be laid out at a width at or above the
one at which the card face presents its ability text, set, and number, so the player can read what
they just won.

#### Scenario: An opened card is a real card face

- **WHEN** a card is revealed
- **THEN** it is rendered by the shared card component with its artwork, star track, chevrons, and stat bars

#### Scenario: An opened card is readable

- **WHEN** a card is revealed
- **THEN** its ability text, set, and number are legible on the card face

#### Scenario: The five-card summary still respects the card minimum

- **WHEN** all five cards are shown together at the end of the opening
- **THEN** no card is laid out below the card's minimum supported width

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

### Requirement: A temporary Geo grant is available and labelled as such

Until Geo can be earned through play, the Shop SHALL offer a control that credits Geo to the player.
That control SHALL be plainly marked as a temporary development aid and SHALL NOT be dressed as a
game mechanic, a reward, or a purchase of currency.

#### Scenario: The grant credits Geo

- **WHEN** the player uses the grant control
- **THEN** their Geo balance rises and the purse updates

#### Scenario: The grant is honest about what it is

- **WHEN** the player views the grant control
- **THEN** it states that it is a temporary development aid

#### Scenario: The grant is not presented as a purchase

- **WHEN** the player views the Shop
- **THEN** no real-money purchase, currency bundle, or reward claim is presented

### Requirement: Power-ups and cosmetics are present as honest placeholders

The Shop SHALL show that power-ups and cosmetics will be sold there, marked as forthcoming. Those
placeholders MUST NOT present prices, purchasable items, or an inventory as though they were
functional, and MUST NOT be reachable as a purchase.

#### Scenario: The forthcoming wares are visible

- **WHEN** the player views the Shop
- **THEN** power-ups and cosmetics are shown as sections of the Shop marked as forthcoming

#### Scenario: The placeholders are inert

- **WHEN** the player activates a power-up or cosmetic placeholder
- **THEN** nothing is purchased and no Geo is spent

#### Scenario: The placeholders claim no prices

- **WHEN** the power-up and cosmetic placeholders are viewed
- **THEN** they present no price and no purchasable item

### Requirement: The Shop page fits the viewport

The Shop page SHALL fit within the viewport without clipping its content and SHALL make use of the space available to it.

#### Scenario: Rendering at a range of viewport sizes

- **WHEN** the Shop page renders
- **THEN** its content is fully visible without being clipped

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
