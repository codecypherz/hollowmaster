## MODIFIED Requirements

### Requirement: The user record outlives a page load

The user's collection, Geo balance, Rosary balance, and decks SHALL be restored when the
application is loaded again on the same browser. A change to any of them SHALL be durable without
the player taking any explicit save action. The cart of pending exchanges is not part of the user:
it SHALL NOT be persisted, and what is pending in it is not an unsaved change to the user.

#### Scenario: Holdings survive a reload

- **WHEN** the user's balance and collection are changed, and the page is then reloaded
- **THEN** the restored user has the changed balance and the changed collection

#### Scenario: Rosaries survive a reload

- **WHEN** the player sells and buys cards for Rosaries, and the page is then reloaded
- **THEN** the restored user has the same Rosary balance, the same collection, and the same decks
  the exchanges left

#### Scenario: Decks survive a reload

- **WHEN** decks are created, filled, or deleted, and the page is then reloaded
- **THEN** the restored user holds the same decks, in the same order, each holding the same cards
  in the same positions

#### Scenario: No explicit save is required

- **WHEN** the user's state changes
- **THEN** it is persisted without the player being asked to save
- **AND** no unsaved-changes state is presented anywhere

#### Scenario: The cart is not persisted

- **WHEN** the player adds cards to the cart without confirming it, and the page is then reloaded
- **THEN** the restored user is exactly as it was before the cards were added to the cart
- **AND** the cart is empty

#### Scenario: A first visit seeds rather than restores

- **WHEN** the application is loaded on a browser that holds no stored user
- **THEN** a new user is created with the starter collection, zero Geo, zero Rosaries, and one
  empty deck
- **AND** that new user is persisted, so a further reload restores it rather than reseeding
