## ADDED Requirements

### Requirement: The Shop shows the player's Geo purse

The Shop SHALL display the player's current Geo balance whenever the page is shown, naming the
currency as Geo. The displayed balance SHALL reflect the user's actual balance and SHALL update as
soon as that balance changes.

#### Scenario: The purse is visible on arrival

- **WHEN** the player navigates to the Shop
- **THEN** their Geo balance is shown, named as Geo

#### Scenario: The purse follows a purchase

- **WHEN** the player buys a pack
- **THEN** the displayed balance falls by that pack's price without the page being reloaded

#### Scenario: A zero balance is shown as zero

- **WHEN** a new player with no Geo views the Shop
- **THEN** the purse shows zero rather than being hidden or left blank

### Requirement: All three pack tiers are presented as wares

The Shop SHALL present each of the three pack tiers, each naming itself, stating its price in Geo,
stating that it contains five cards, and conveying the character of its odds so a player can tell
the tiers apart before buying. The three SHALL be presented together, in ascending order of price.

#### Scenario: The three tiers are on offer

- **WHEN** the player views the Shop
- **THEN** Level 1, Level 2, and Level 3 packs are all presented
- **AND** each states its Geo price and that it holds five cards

#### Scenario: The tiers are distinguishable before purchase

- **WHEN** the player compares two pack tiers
- **THEN** each conveys how its odds differ — that the higher tier favours rarer cards

#### Scenario: The tiers read in price order

- **WHEN** the packs are presented
- **THEN** they appear in ascending order of price

### Requirement: A pack the player cannot afford cannot be bought

A pack whose price exceeds the player's Geo balance SHALL be presented as unaffordable and SHALL
NOT be purchasable — by pointer, by keyboard, or by any other means the screen offers. The reason
SHALL be evident from the screen rather than only on attempting the purchase.

#### Scenario: An unaffordable pack is marked and inert

- **WHEN** the player's balance is below a pack's price
- **THEN** that pack is visibly marked as unaffordable
- **AND** activating it neither opens a pack nor changes the balance

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
Skipping SHALL change nothing about what was drawn: the same five cards are granted whether the
sequence was watched or skipped, and the purchase is settled at the moment of buying rather than at
the end of the animation.

#### Scenario: Skipping shows the whole result

- **WHEN** the player skips partway through an opening
- **THEN** all five cards are shown immediately

#### Scenario: Skipping does not change the draw

- **WHEN** the player skips an opening
- **THEN** the cards granted are the same five that were drawn

#### Scenario: Leaving mid-opening does not forfeit the pack

- **WHEN** the player navigates away before the opening finishes
- **THEN** the Geo is still spent and the five cards are still in their collection

### Requirement: The opening honours a reduced-motion preference

Where the player has asked for reduced motion, the opening SHALL present its result without the
animated sequence — the five cards appear in their common-to-rare order without travel, flourish, or
staged timing. No information conveyed by the animation MUST be available only through it.

#### Scenario: Reduced motion collapses the sequence

- **WHEN** the player has requested reduced motion and buys a pack
- **THEN** the five cards are presented without animated arrival

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

### Requirement: The opening fits the viewport

The opening SHALL be fully visible within the viewport for its whole duration — during the staged
reveal and in the five-card summary that follows — without clipping a card, producing a scrollbar, or
pushing the storefront out from under it.

#### Scenario: The reveal fits at a range of viewport sizes

- **WHEN** a pack is opened at viewport sizes from a large desktop down to a small laptop
- **THEN** every revealed card is fully visible and no scrollbar appears

#### Scenario: Returning to the storefront restores the page

- **WHEN** the player closes the opening
- **THEN** the storefront is shown intact, with the updated purse

## REMOVED Requirements

### Requirement: The Shop page exists as a themed placeholder

**Reason**: The Shop is no longer a placeholder. Its requirement that the page "does not present
purchasable packs, prices, or a currency balance as though they were functional" directly
contradicts the storefront added by this change, in which all three are functional.

**Migration**: The requirements added above replace it. The page still names itself as the Shop and
still keeps its themed treatment — that continuity is carried by the surviving "The Shop page fits
the viewport" requirement and by the design system's style guide. Honesty about unbuilt features is
preserved, narrowed to the features that are genuinely unbuilt, by "Power-ups and cosmetics are
present as honest placeholders" and by "A temporary Geo grant is available and labelled as such".
