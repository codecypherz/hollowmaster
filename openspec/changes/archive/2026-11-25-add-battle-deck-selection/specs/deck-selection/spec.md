## Purpose

Defines the deck selection screen. It stands between the Battle page and a match: it shows the
player's decks, lets them choose one that is ready for battle and read its cards, and starts the
battle with that deck. It never changes a deck.

## ADDED Requirements

### Requirement: Beginning a battle passes through deck selection

Activating the control that begins a battle on the Battle page SHALL open the deck selection screen.
It SHALL NOT start a match. A match SHALL be started only from the deck selection screen.

#### Scenario: The Battle page leads to deck selection

- **WHEN** the player activates the control that begins a battle on the Battle page
- **THEN** the deck selection screen renders
- **AND** no match has been started

#### Scenario: Leaving deck selection starts nothing

- **WHEN** the player leaves the deck selection screen by the browser's back control or the
  navigation, without beginning the battle
- **THEN** no match is started

### Requirement: The deck selection screen borrows the Decks page's look and feel

The deck selection screen SHALL be visibly one of the out-of-battle pages, alongside the Decks and
Collection pages. It SHALL use the same void background, mist, and floating particles. It SHALL be
named by the design system's single-line screen header, titled `Choose a Deck`, on a single line at
every viewport it supports. It SHALL draw no corner frame. It SHALL present the player's decks as a
row of deck buttons styled as the Decks page's deck buttons. It SHALL present the chosen deck's nine
positions as the Decks page presents the selected deck's positions. Every card it renders SHALL obey
the card design constraints.

#### Scenario: The page is titled on one line

- **WHEN** the deck selection screen renders at any viewport it supports
- **THEN** its title `Choose a Deck` is presented by the shared single-line screen header
- **AND** the header occupies a single line

#### Scenario: The deck buttons match the Decks page

- **WHEN** the deck selection screen renders for a player holding three decks
- **THEN** three deck buttons are presented in the order Deck 1, Deck 2, Deck 3
- **AND** the chosen button shows the deck's full positional name, and every other button shows
  only its numeral
- **AND** every deck button's accessible name is the deck's full positional name

#### Scenario: No corner frame is drawn

- **WHEN** the deck selection screen renders
- **THEN** no corner frame ornament is drawn on it

### Requirement: The deck selection screen fits the viewport

The deck selection screen SHALL fit within the viewport without clipping its content. The document
SHALL NOT scroll in either axis. Where the viewport is too small to lay the deck's nine positions out
at the card renderer's minimum supported width, the deck region SHALL be uniformly scaled as a whole
rather than laying any card out below that minimum.

#### Scenario: The page does not scroll

- **WHEN** the deck selection screen is rendered at any viewport size it supports
- **THEN** the document scrolls neither horizontally nor vertically
- **AND** the deck buttons, the chosen deck's positions, and the control that begins the battle are
  wholly on screen

#### Scenario: A narrow viewport scales the deck

- **WHEN** the viewport cannot host nine deck positions at the card renderer's minimum supported
  width
- **THEN** the deck region is uniformly scaled down as a whole
- **AND** no card is laid out below the renderer's minimum supported width

### Requirement: Only a ready deck can be chosen

The deck selection screen SHALL list every deck the player holds. Only decks eligible for battle, as
stated by `user/decks`, SHALL be choosable. The button of an Invalid or Incomplete deck SHALL be
presented but disabled. Activating it SHALL NOT change the chosen deck. It SHALL remain reachable by
keyboard and SHALL state, both as a tooltip and to assistive technology, which problem keeps it out
of battle, using the same words the deck's standing uses: `Invalid`, `Incomplete`, or both with
Invalid first.

#### Scenario: An incomplete deck cannot be chosen

- **WHEN** the player holds a Ready Deck 1 and an Incomplete Deck 2, and activates Deck 2's button
- **THEN** Deck 1 remains the chosen deck
- **AND** Deck 2's button is announced as unavailable, giving Incomplete as the reason

#### Scenario: An invalid deck cannot be chosen

- **WHEN** a deck's standing reports Invalid, whether or not it is also Incomplete
- **THEN** its button is disabled and names Invalid as the reason
- **AND** activating it does not choose it

#### Scenario: Eligibility follows the standing

- **WHEN** the set of decks the screen allows to be chosen is compared with the decks whose standing
  is Ready
- **THEN** the two sets are identical

### Requirement: The screen opens on the remembered deck, or else the first ready deck

When the deck selection screen opens, the chosen deck SHALL be the deck the player last chose for
battle, if that deck is still Ready. Otherwise it SHALL be the first Ready deck in the decks' own
order. If the player holds no Ready deck, no deck SHALL be chosen.

#### Scenario: A first visit defaults to the first ready deck

- **WHEN** a player who has never chosen a deck holds an Incomplete Deck 1 and Ready Decks 2 and 3,
  and opens deck selection
- **THEN** Deck 2 is the chosen deck

#### Scenario: The remembered deck is the default

- **WHEN** the player chose Deck 3 on an earlier visit, and Deck 3 is still Ready
- **THEN** opening deck selection, even after a reload, has Deck 3 chosen

#### Scenario: A remembered deck that is no longer ready is passed over

- **WHEN** the player's remembered deck has become Incomplete since it was chosen, for example
  because a sale trimmed it
- **THEN** opening deck selection has the first Ready deck chosen instead

### Requirement: Choosing a deck is remembered

Choosing a Ready deck on the deck selection screen SHALL record it as the player's remembered battle
deck at once, as stated by `user/decks`. Beginning a battle SHALL also record the deck it begins
with. Opening the screen and accepting its default SHALL NOT be required for the choice to persist.

#### Scenario: A choice survives leaving without battling

- **WHEN** the player chooses Deck 2 and then leaves deck selection without beginning a battle
- **THEN** the next time deck selection opens, Deck 2 is chosen

#### Scenario: Beginning with the default records it

- **WHEN** the player begins a battle with the default deck, never having chosen one explicitly
- **THEN** that deck becomes the player's remembered battle deck

### Requirement: The chosen deck's cards are shown

The deck selection screen SHALL show every card of the chosen deck in its nine positions, in deck
order, at the size the Decks page shows them. Beneath the positions it SHALL state that the deck is
ready for battle. Changing the chosen deck SHALL show that deck's cards at once.

#### Scenario: The chosen deck is shown

- **WHEN** Deck 2 is chosen
- **THEN** Deck 2's nine cards are shown in deck order

#### Scenario: Choosing another deck shows it

- **WHEN** the player chooses a different Ready deck
- **THEN** that deck's nine cards replace those shown

### Requirement: With no ready deck the screen says so and offers the Decks page

When the player holds no Ready deck, the deck selection screen SHALL state plainly that no deck is
ready for battle. It SHALL offer a way to the Decks page to build one. Any decks the player holds
SHALL still be listed, disabled, each stating its problem.

#### Scenario: A new player has no ready deck

- **WHEN** a player created with no prior data opens deck selection
- **THEN** no deck is chosen
- **AND** the screen states that no deck is ready for battle and offers the Decks page
- **AND** the seeded deck's button is disabled and states Incomplete

#### Scenario: The way to the Decks page works

- **WHEN** the player follows the screen's offer of the Decks page
- **THEN** the Decks page renders

### Requirement: The deck selection screen never changes a deck

The deck selection screen SHALL offer no control that creates, deletes, or reorders a deck, or that
adds a card to it or removes one from it. Nothing done on the screen SHALL change any deck's
contents or the collection.

#### Scenario: No editing control is offered

- **WHEN** the deck selection screen renders with a deck chosen
- **THEN** it presents no control to create a deck, delete a deck, add a card, or remove a card

#### Scenario: Using the screen leaves the decks as they were

- **WHEN** the player chooses decks, reads cards, and leaves the screen
- **THEN** every deck holds exactly the cards it held before, in the same order

### Requirement: Selecting a card on the deck selection screen reads it

Selecting a card in the chosen deck SHALL open the reading presentation for that card at once, with
no menu or other step between. The presentation SHALL offer no action on the card other than closing
it. Opening and dismissing the presentation SHALL NOT change, reorder, resize, or scroll the deck.

#### Scenario: A deck card is read

- **WHEN** the player selects a card in the chosen deck
- **THEN** the reading presentation opens showing that card at a size that shows its ability text

#### Scenario: Reading offers only Close

- **WHEN** the reading presentation is open on the deck selection screen
- **THEN** its only control is the one that closes it

#### Scenario: The deck does not move

- **WHEN** the reading presentation is opened and dismissed
- **THEN** every card in the deck has the position and size it had before

### Requirement: The battle begins from the deck selection screen

The deck selection screen SHALL present a control that begins the battle with the chosen deck.
Activating it SHALL start a match with that deck and navigate to the in-game route. When no deck is
chosen, the control SHALL be presented but disabled. It SHALL stay reachable by keyboard, state that
a ready deck is needed, and start nothing when activated.

#### Scenario: Beginning the battle

- **WHEN** a Ready deck is chosen and the player activates the control that begins the battle
- **THEN** a match is started with the chosen deck
- **AND** the application navigates to the in-game route

#### Scenario: No battle without a ready deck

- **WHEN** no deck is chosen and the player activates the control that begins the battle
- **THEN** no match is started and the application stays on the deck selection screen

### Requirement: Every action on the deck selection screen is operable by keyboard

Choosing a deck, reading a card, closing the reading presentation, following the offer of the Decks
page, and beginning the battle SHALL each be operable by keyboard alone. Each SHALL show a visible
focus indicator.

#### Scenario: A battle is begun by keyboard alone

- **WHEN** the player tabs to a Ready deck's button, activates it, then tabs to the control that
  begins the battle and activates it
- **THEN** a match starts with that deck

### Requirement: The deck selection screen honours a reduced-motion preference

When the player's system requests reduced motion, the deck selection screen SHALL render in its
finished state, with every element visible and no entrance or transition animation. Every control
SHALL be immediately available.

#### Scenario: Reduced motion is requested

- **WHEN** the deck selection screen renders with a reduced-motion preference
- **THEN** every deck button, deck position, and control is visible at once without animating
