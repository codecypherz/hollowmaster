## Why

Players can build decks, and the deck rules already define which decks are eligible for battle, but
nothing uses a deck yet: the Battle page's control drops the player straight into a match with a
hand dealt at random from the whole card database. Choosing a deck before each battle is what makes
deck building matter.

## What Changes

- Activating the Battle page's control that begins a battle no longer starts a match. It opens a new
  **deck selection screen** at its own route.
- The deck selection screen borrows the Decks and Collection pages' look and feel: the void
  background and particles, the single-line screen header, no corner frame, a row of deck buttons,
  and the chosen deck's nine cards shown as on the Decks page. The page fits the viewport and honours
  a reduced-motion preference.
- The screen is read-only. It offers no create, delete, add, or remove control, and nothing on it
  changes a deck's contents.
- Only decks whose standing is Ready can be chosen. Invalid or Incomplete decks are still listed, but
  their buttons are disabled and say why.
- The screen opens on the deck the player last chose, if it is still Ready. Otherwise it opens on the
  first Ready deck. With no Ready deck, nothing is chosen, the screen says so and links to the Decks
  page, and the control that begins the battle is disabled.
- The player's choice is remembered on the user record, so it persists across reloads. It follows
  the deck when an earlier deck is deleted, and it is cleared when the chosen deck itself is deleted.
- Selecting a card in the shown deck opens the existing reading presentation, with Close as its only
  action.
- The deck selection screen holds the control that begins the battle. Activating it starts a match
  and navigates to the in-game route.
- **BREAKING (rules)**: the player's hand is now the chosen deck's nine cards, in deck order. The
  opponent's hand is still dealt at random from the card database.
- **BREAKING (persistence)**: the persisted user gains the remembered battle deck, which raises the
  schema version. Records at earlier versions upgrade with no deck remembered.

## Capabilities

### New Capabilities

- `deck-selection`: the deck selection screen. Covers how it is reached, its look and feel, which
  decks can be chosen, its default, the shown deck and card reading, its read-only nature, and
  starting the battle from it.

### Modified Capabilities

- `battle`: activating the control that begins a battle leads to deck selection rather than
  starting a match, and that activation is still never gated by the entrance.
- `navigation/routing`: deck selection gets its own route. Starting a battle now goes from the
  Battle page through deck selection to the in-game route.
- `game/rules`: the player's hand is dealt from the chosen deck in deck order. The opponent's hand
  is still dealt from the card database.
- `user/decks`: the user remembers which deck they last chose for battle, and deleting a deck keeps
  that choice pointing at the same deck.
- `user/data-model`: the user carries a sixth thing, the remembered battle deck.
- `user/persistence`: the remembered battle deck is persisted, the schema version is raised, earlier
  records upgrade, and a stored choice that names no deck is read as no choice.

## Impact

- **Routes**: a new eager route for deck selection in `src/app/app.routes.ts`. The nav shell stays
  visible on it, and the Battle link stays active.
- **Components**: a new `src/components/deck-select/` page. `Battle` navigates to that page instead
  of starting a game. `DeckBar` gains a read-only "choose" mode, so the deck row, positions,
  standing, and scaling are shared rather than copied. `CardReader` is reused unchanged.
- **Model/services**: `UserState` gains `battleDeck: number | null`. The deck operations in
  `deck.ts` keep it consistent on deletion, `user.ts` persistence moves to schema version 5, and
  `UserService` gains a command to choose the battle deck. `GameService.startGame` takes the chosen
  deck and deals the player's hand from it.
- **Tests**: Vitest for the model, service, and new page. The Playwright helper `startMatch` and
  every spec that clicks "Start Game" must seed a Ready deck and go through deck selection. A new
  `e2e/deck-select.spec.ts` covers fit, read-only behaviour, the default, and reading a card.
