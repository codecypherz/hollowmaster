## Purpose

Defines the pending order of card sales and purchases a player builds on the Collection page: what
it holds and for how long, how it is reviewed and adjusted, and what confirming it does.

## Requirements

### Requirement: The cart holds at most one pending line per card

The cart SHALL hold, for each card with anything pending, one line: a direction, sell or buy, and a
whole-number quantity of at least one. A card MUST NOT be pending in both directions. Raising a
card's quantity in one direction SHALL set its quantity in the other to zero. A quantity brought to
zero from the Collection page SHALL take the card out of the cart. A pending sale MUST NOT exceed
the number of copies held. A pending purchase MUST NOT exceed 99 copies. A card whose rarity's rate
the player does not know MUST NOT be pending for purchase. A line's place in the cart SHALL be the
order in which its card was first added, and changing its quantity or direction MUST NOT move it.

#### Scenario: Adding a card creates a line

- **WHEN** the player raises the buy quantity of a card with nothing pending to 2
- **THEN** the cart holds one line for that card, buying 2

#### Scenario: Switching direction replaces the line

- **WHEN** a card is pending as a purchase of 3 and the player raises its sell quantity
- **THEN** the cart holds one line for that card, selling 1
- **AND** its buy quantity reads 0

#### Scenario: A quantity of zero leaves the cart

- **WHEN** the player lowers a card's only pending quantity to 0 on the Collection page
- **THEN** the cart holds no line for that card

#### Scenario: A sale is bounded by the copies held

- **WHEN** a player holding 2 copies of a card has 2 pending for sale and asks to sell one more
- **THEN** the pending sale is still 2

#### Scenario: A purchase is bounded

- **WHEN** a card has 99 copies pending for purchase and the player asks for one more
- **THEN** the pending purchase is still 99

#### Scenario: A card whose rate is not known cannot be added

- **WHEN** a player who does not know the rarity 6 rate asks to buy a six-star card
- **THEN** the cart holds no line for that card

### Requirement: Nothing changes until the cart is confirmed

Adding to, adjusting, or removing from the cart MUST NOT change the collection, either currency
balance, or any deck, wherever they are read.

#### Scenario: Pending purchases spend nothing

- **WHEN** a player holding 500 Rosaries adds purchases to the cart
- **THEN** the Rosary balance is still 500
- **AND** every card's held count is unchanged

#### Scenario: Pending sales leave decks alone

- **WHEN** the player adds to the cart the sale of their only copy of a card a deck uses
- **THEN** that deck still holds the card

### Requirement: The cart lasts until the application is reloaded

The cart SHALL keep its contents while the player moves between pages, including into and out of a
battle. It SHALL NOT be persisted: after a reload it SHALL be empty. Confirming the cart SHALL empty
it, and so SHALL resetting the player's data. Where the copies held of a card fall below its pending
sale for any other reason, the pending sale SHALL be reduced to the copies held.

#### Scenario: The cart survives navigation

- **WHEN** the player adds cards to the cart, visits the Shop and the Decks page, and returns to the
  Collection page
- **THEN** the cart holds the same lines

#### Scenario: A reload empties the cart

- **WHEN** the player adds cards to the cart and reloads the application
- **THEN** the cart is empty

#### Scenario: A data reset empties the cart

- **WHEN** the cart holds lines and the player confirms the Decks page's data reset
- **THEN** the cart is empty

### Requirement: The cart control sits in the top-left corner of the Collection page

The Collection page SHALL show a cart control in the top-left corner of the page at all times,
including when the cart is empty. It SHALL show the total number of copies pending across all lines.
Its accessible name SHALL state that it is the cart and how many cards are pending, such as
`Cart, 3 cards pending`. The count SHALL follow the cart without the page being reloaded. The
control MUST NOT overlap the screen header's title or the purse, and SHALL stay in place while the
sections scroll. Activating it SHALL open the cart dialog.

#### Scenario: The control is in the top-left corner

- **WHEN** the Collection page renders at any viewport size it supports
- **THEN** the cart control is shown at the top-left of the page
- **AND** it overlaps neither the page's title nor the purse

#### Scenario: The control counts copies

- **WHEN** the cart holds a sale of 2 of one card and a purchase of 1 of another
- **THEN** the control shows 3

#### Scenario: An empty cart is still offered

- **WHEN** nothing is pending
- **THEN** the cart control is still shown
- **AND** its accessible name states that no cards are pending

### Requirement: The cart dialog lists each pending line as a row

The cart dialog SHALL present one row per line, in the cart's order. A row SHALL state in words
whether it is a sell or a buy, and SHALL show the card's name, its quantity as an editable field
with a control to lower it and a control to raise it, its effect on Rosaries, and a control that
removes it. The quantity and its two controls SHALL be one joined bar through the design system's
segmented control, accented as on the Collection page. A row MUST NOT render the card. The effect
SHALL be the quantity times the card's sale or purchase price, rendered through the Rosary amount
primitive and preceded by a plus sign for a sale or a minus sign for a purchase, so that the
direction does not rely on colour. Where the rows do not fit, the list of rows SHALL scroll inside
the dialog, while the totals and the dialog's controls stay visible. Where the cart is empty, the
dialog SHALL say so.

#### Scenario: A sale row

- **WHEN** the cart holds a sale of 3 copies of a two-star card
- **THEN** its row reads as a sell, names the card, shows a quantity of 3, and shows plus 9 followed
  by the Rosary mark

#### Scenario: A purchase row

- **WHEN** the cart holds a purchase of 2 copies of a one-star card
- **THEN** its row reads as a buy, names the card, shows a quantity of 2, and shows minus 8
  followed by the Rosary mark

#### Scenario: No card is rendered

- **WHEN** the cart dialog is open
- **THEN** no row renders a card face or its artwork

#### Scenario: Many rows

- **WHEN** the cart holds more rows than the dialog can show at the smallest supported viewport
- **THEN** the rows scroll inside the dialog
- **AND** the totals and the confirm control remain visible
- **AND** the page behind does not scroll

#### Scenario: An empty cart says so

- **WHEN** the dialog is open and the cart is empty
- **THEN** it states that the cart is empty and presents no rows

### Requirement: Rows can be adjusted and removed in the dialog

Raising or lowering a row's quantity in the dialog, or typing one, SHALL change the cart at once,
and the row's effect, the totals, the confirm control, the cart control, and that card's rows on the
Collection page SHALL all follow. A row's quantity SHALL be bounded exactly as on the Collection
page. The control that lowers it SHALL be unavailable at 1, so that a row leaves only by its remove
control. A quantity SHALL be typed as on the Collection page, taking effect on Enter or on leaving
the field, except that a typed zero SHALL become 1. Escape pressed in a field whose quantity is
being edited SHALL abandon that edit and leave the dialog open. Otherwise Escape SHALL dismiss the
dialog. The field's accessible name SHALL state the direction and the card. Removing a row SHALL
take its line out of the cart. Focus SHALL then move to the next row's remove control, else the
previous row's, else the dialog's close control.

#### Scenario: Adjusting a quantity

- **WHEN** a row selling 2 copies of a one-star card is raised to 3
- **THEN** its effect reads plus 3
- **AND** the net change and the confirm control follow
- **AND** the card's Sell row on the Collection page reads 3

#### Scenario: A sale cannot be raised past the copies held

- **WHEN** a row sells every copy held
- **THEN** its raising control is unavailable

#### Scenario: Lowering stops at one

- **WHEN** a row's quantity is 1
- **THEN** its lowering control is unavailable and the row remains

#### Scenario: Removing a row

- **WHEN** the player removes the first of two rows
- **THEN** one row remains and the totals follow
- **AND** focus is on the remaining row's remove control

#### Scenario: Removing the last row

- **WHEN** the player removes the only row
- **THEN** the dialog stays open, stating that the cart is empty
- **AND** focus is on its close control

#### Scenario: Typing a quantity

- **WHEN** the player types 12 into the quantity of a row buying 1 copy of a one-star card and
  presses Enter
- **THEN** its effect reads minus 48 and the totals, the confirm control, and the card's Buy row on
  the Collection page follow
- **AND** the dialog is still open with focus in the field

#### Scenario: A typed quantity is bounded

- **WHEN** the player types 200 into a row's quantity that buys a card and leaves the field
- **THEN** it reads 99

#### Scenario: A typed zero does not remove the row

- **WHEN** the player types 0 into a row's quantity and presses Enter
- **THEN** the row remains with a quantity of 1

#### Scenario: Escape abandons an edit before it closes the dialog

- **WHEN** the player types 7 into a quantity that held 2 and presses Escape
- **THEN** the field reads 2 and the dialog is still open
- **AND** pressing Escape again closes the dialog with 2 still pending

#### Scenario: A typed quantity counts before confirming

- **WHEN** the player types a quantity that makes the cart unaffordable and then activates the
  confirm control without pressing Enter
- **THEN** the typed quantity takes effect first and nothing is bought or sold

### Requirement: The dialog shows the cart's effect on the balance

The cart dialog SHALL show the current Rosary balance, the net change the cart would make, and the
balance it would leave, each through the Rosary amount primitive. The net SHALL be the total of
pending sales less the total of pending purchases, preceded by a plus or minus sign when it is not
zero. Where the net would leave the balance below zero, the dialog SHALL show how many Rosaries the
player is short in place of the balance after, and MUST NOT rely on colour to mark it.

#### Scenario: A net gain

- **WHEN** a player holding 50 Rosaries has sales of 60 and purchases of 0 pending
- **THEN** the dialog shows a balance of 50, a net of plus 60, and a balance after of 110

#### Scenario: Sales pay for purchases

- **WHEN** a player holding 50 Rosaries has sales of 60 and a purchase of 100 pending
- **THEN** the dialog shows a net of minus 40 and a balance after of 10
- **AND** the cart can be confirmed

#### Scenario: A shortfall

- **WHEN** a player holding 50 Rosaries has only a purchase of 300 pending
- **THEN** the dialog states that the player is short by 250

### Requirement: The confirm control states the net and is withheld when it cannot apply

The dialog's confirm control SHALL state the net change: a plus sign and the amount where Rosaries
would be gained, a minus sign and the amount where they would be spent, and zero where they cancel
out. Its accessible name SHALL put that in words, such as `Confirm, spend 40 Rosaries`. The control
SHALL be unavailable while the cart is empty or the net would leave the balance below zero. While
unavailable, it SHALL remain focusable, activating it SHALL do nothing, and the reason SHALL be
available as its tooltip and to assistive technology. It SHALL become available, without the dialog
being reopened, as soon as the cart can be settled. A net of exactly the balance SHALL be affordable.

#### Scenario: The control states a gain

- **WHEN** the cart's net is a gain of 60
- **THEN** the confirm control shows plus 60 followed by the Rosary mark

#### Scenario: The control states a spend

- **WHEN** the cart's net is a spend of 40
- **THEN** the confirm control shows minus 40 followed by the Rosary mark
- **AND** assistive technology reads it as confirming a spend of 40 Rosaries

#### Scenario: A net of zero can be confirmed

- **WHEN** the cart holds sales and purchases that cancel out
- **THEN** the confirm control shows zero and is available

#### Scenario: An unaffordable cart cannot be confirmed

- **WHEN** the player activates confirm on a cart whose net exceeds the balance
- **THEN** nothing is bought or sold and the cart is unchanged
- **AND** the control's tooltip and accessible description state that there are not enough Rosaries

#### Scenario: Adjusting makes it affordable

- **WHEN** the player lowers a purchase until the net is within the balance
- **THEN** the confirm control becomes available

#### Scenario: An empty cart cannot be confirmed

- **WHEN** the cart is empty
- **THEN** the confirm control is unavailable and states that the cart is empty

### Requirement: Confirming settles the whole cart at once

Confirming SHALL perform every pending sale and purchase as one settled outcome, with no further
confirmation step. The result SHALL be durable and SHALL be visible without a reload wherever the
user is read. The cart SHALL then be empty and the dialog SHALL close. Where the cart cannot be
settled, nothing SHALL change and the cart SHALL keep its lines.

#### Scenario: Confirming buys and sells

- **WHEN** a player holding 50 Rosaries and six copies of a one-star card confirms a cart selling 6
  of it and buying 1 of another one-star card
- **THEN** the balance is 52
- **AND** the first card is held 0 times and the other one more time than before
- **AND** the cart is empty and the dialog is closed

#### Scenario: A confirmed cart survives a reload

- **WHEN** the player confirms a cart and reloads the application
- **THEN** the balance, the collection, and the decks reflect it

#### Scenario: Closing confirms nothing

- **WHEN** the player closes the dialog without confirming
- **THEN** nothing is bought or sold
- **AND** the cart holds the same lines

### Requirement: A pending sale that would trim decks is marked in the cart

Where settling a pending sale would take copies of its card out of one or more decks, the sale's row
SHALL carry a warning mark that does not rely on colour, and SHALL name every deck that would lose
copies in visible text, such as `Removes it from Deck 1 and Deck 3`. A sale that would trim no deck
SHALL carry no warning.

#### Scenario: A trimming sale is named

- **WHEN** the cart holds the sale of a player's only copy of a card used by Deck 1 and Deck 3
- **THEN** its row carries a warning naming Deck 1 and Deck 3

#### Scenario: The warning follows the quantity

- **WHEN** a player holding 3 copies of a card, used twice by one deck, has 1 pending for sale and
  raises it to 2
- **THEN** the row had no warning at 1 and names that deck at 2

#### Scenario: Confirming trims the named decks

- **WHEN** the player confirms a cart whose rows name Deck 1 and Deck 3
- **THEN** those decks lose the copies and no other deck is changed

### Requirement: The cart dialog is modal and operable by keyboard

The cart dialog SHALL be presented over the page as a modal dialog named `Cart`, and SHALL fit
within every viewport the page supports. On opening, focus SHALL move to its close control. Focus
SHALL stay inside it while it is open. It SHALL be dismissed by its close control, by Escape, and by
activating the area outside it. On dismissal or confirmation, focus SHALL return to the cart
control. Every control and quantity field in it SHALL be reachable and operable by keyboard with a
visible focus indicator, and its accessible name SHALL name the card it acts on where it acts on
one. Where a reduced-motion preference is expressed, the dialog SHALL appear and disappear without
animation.

#### Scenario: Opening and dismissing by keyboard

- **WHEN** the player activates the cart control by keyboard and then presses Escape
- **THEN** the dialog opens with focus on its close control, and then closes
- **AND** focus is on the cart control

#### Scenario: Focus is held inside

- **WHEN** the dialog is open and the player tabs past its last control
- **THEN** focus moves to its first control

#### Scenario: Dismissing by the surrounding area

- **WHEN** the player activates the area outside the dialog
- **THEN** it closes and the cart is unchanged

### Requirement: Cart changes and outcomes are announced

Each change to a pending quantity SHALL be announced to assistive technology without moving focus,
naming the card, the direction, and the new quantity, and saying where a change cleared the other
direction. Confirming SHALL be announced with the number of cards sold and bought, the Rosaries
gained or spent, and any decks that lost cards.

#### Scenario: A quantity change is announced

- **WHEN** the player raises the sell quantity of Crawlid to 2
- **THEN** assistive technology announces that 2 Crawlid are pending for sale
- **AND** focus stays on the control that was activated

#### Scenario: A confirmation is announced

- **WHEN** the player confirms a cart that sells 2 cards and buys 1, spending 80 in all and removing
  a card from Deck 2
- **THEN** assistive technology announces 2 sold, 1 bought, 80 Rosaries spent, and the removal from
  Deck 2
