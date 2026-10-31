## Context

The Cards page is built from three components plus the model and service beneath them:

- **`src/components/collection/`**: the page. It holds screen state: `sort: SortKey`,
  `selectedDeck`, `openMenu`, and `reading`. It computes one page-wide `canAdd` / `addReason` and
  hands both to the grid and to the reader.
- **`src/components/deck-bar/`**: the pinned region. A `role="tablist"` of `.deck-tab` buttons
  with a roving tabindex and arrow keys, each carrying a `.tab-mark` diamond. These sit in a
  `.tab-strip` that is `flex: 1` and centred, so the `.controls-sep` and `.deck-controls` group is
  pushed to the row's end. At `MAX_DECKS` the + button is removed and a `.bar-note` is shown in its
  place. The delete confirmation is local markup in this component.
- **`src/components/collection-grid/`**: one flat `.grid` tracked by `entry.card`. Tiles are
  addressed by their flat `$index` in the page's `owned()` array. A `.badge` shows `×N`. The
  `tileIn` animation is a CSS `animation` on `.tile`.
- **Model and service.** `src/model/collection.ts` holds `SORTS` with a fixed `direction` per key
  and `sortOwned(owned, key)` with a name→identity tie-break. `src/model/deck.ts#addCardToDeck`
  refuses only for no deck, a full deck, or an unowned card. `src/model/user.ts#fromPersisted`
  trims decks to `MAX_DECKS` and `DECK_SIZE` and drops unowned keys. `UserService` has no way to
  replace the whole state except `load()`.

**Why only some tiles animate today.** Because the `@for` tracks by card, a reorder moves existing
DOM nodes rather than recreating them. A node that Angular re-inserts restarts its CSS animation.
A node it leaves in place does not. So the visible effect depends on the diff Angular happens to
compute.

## Goals / Non-Goals

**Goals:**

- The copy limit is a model rule, enforced in one pure function. The page only asks the model
  whether an add is allowed and why not.
- Sort direction and rarity grouping are pure, unit-tested functions in `collection.ts`. The grid
  only renders what it is given.
- One confirmation component serves both delete-deck and reset.

**Non-Goals:**

- FLIP-style motion that slides tiles from their old place to their new one. The request is that
  every tile animates; replaying the entrance satisfies it at a fraction of the cost.
- Remembering the sort order or direction across visits. It stays screen state, and the page
  opens on rarity, descending.
- Showing the used count on the reader, or on deck positions. Only the collection tile badge
  carries it. The reader shows the add action withheld, with the same reason the menu gives.
- Hiding the reset control in production. The user chose to show it in every build.
- Any change to how quantity is gained. Quantities only rise today, so a deck cannot drop below
  its limit at run time. Only a load or a reset can produce over-limit data, and both are handled.

## Decisions

### 1. The copy limit lives in `addCardToDeck`, beside the other refusals

Add `copiesInDeck(deck, card): number` to `deck.ts`. `addCardToDeck` returns `null` when
`copiesInDeck(deck, card) >= quantityOf(state.collection, card)`. Because the check reads only the
target deck, the per-deck scope follows directly. The existing unowned check (`quantity === 0`) is
the same comparison with zero copies in the deck. Keep it as its own line anyway, so the two
refusals read as two reasons.

Add `addRefusal(state, deckIndex, card): 'no-deck' | 'full' | 'unowned' | 'exhausted' | null`. It is a pure
reason function that `addCardToDeck` itself uses, so the page's "why not" can never disagree with
the operation. The page maps each reason to its words:

- `Create a deck first.`
- `Deck N is full.`
- `Every copy you hold is already in Deck N.`

**Alternative:** check in the page or in `UserService`. Rejected because the rule would then live
outside the place every other deck rule lives, and a direct call to `addCardToDeck` could bypass
it.

### 2. Add availability becomes per card, carried in a tile view-model

Today `canAdd` and `addReason` are page-wide scalars. With the copy limit they depend on the card.
The page computes `tiles = computed(() => owned().map(entry => ({ ...entry, used, addReason })))`,
reading `copiesInDeck` from the selected deck and `addRefusal` from the current state. The grid's
`addAvailable` and `addReason` inputs are replaced by fields on each tile. The reader gets the same
two values for the card it is showing, looked up from the same `tiles()` entry, so the menu and
the reader share one source.

### 3. Sort state is `{ key, direction }`, and reversing never touches the tie-break

`SortOrder.direction` becomes `defaultDirection`. The page holds
`sort = signal<{ key: SortKey; direction: 'asc' | 'desc' }>`. `onSort(key)` applies two rules:

- same key → flip the direction
- different key → that key's `defaultDirection`

`sortOwned(owned, key, direction)` negates only the primary comparison. The name→identity ladder
always runs ascending. That is what the spec's "reversing keeps ties in place" requires, and it
keeps every order total. The two-argument form defaults `direction` to the key's default, so
existing callers and tests still compile.

**Chevron.** An inline SVG chevron, drawn only inside the active `.sort-option`, rotated 180° for
ascending. It sits after the label, so the button's width changes only for the active option. It
is `aria-hidden`. A visually hidden span adds `, descending` or `, ascending` to the button's
accessible name. `aria-pressed` remains the "in effect" signal.

### 4. Rarity sections are a projection over the flat sorted list

Add `groupByRarity(sorted): { stars: number; start: number; entries: OwnedCard[] }[]` in
`collection.ts`. It runs over the already-sorted list, so the sections come out in the direction in
effect, and within each section the tie-break order is unchanged. `start` is the flat index of the
section's first entry. Tiles therefore keep their **flat** index, and every existing path that
addresses a tile by index keeps working unchanged: `openIndex`, `addCard.emit(i)`,
`readCard.emit(i)`, and `owned()[i]` in the page.

The grid receives `sections` (always an array, one unlabelled section for non-rarity orders) and
renders each one as `<section>` + an `<h2>` heading + its own `.grid`. For the unlabelled case it
renders a bare `.grid`, so the non-rarity DOM is the same as today. The heading shows the star
glyphs `aria-hidden` and the words `N stars` (visually styled as a quiet label). Section headings
scroll with the collection: they are inside the one scrolling region and are not sticky.

`Collection#restoreFocus` currently finds a tile as `.grid`'s Nth child, which breaks once tiles
are split across several grids. Tiles get a `data-index` attribute, and the lookup becomes
`[data-index="i"]`.

**Alternative:** nest the data as sections in the page and pass `(section, index)` pairs.
Rejected because every handler would then change shape for what is purely a display grouping.

### 5. Every tile replays its entrance by re-keying the grid on each reorder

The page keeps a `sortGeneration` counter, bumped in `onSort`. The grid's `@for` tracks by
`generation + ':' + cardKey(entry.card)`. That makes every reorder recreate every tile, so the CSS
`tileIn` animation, with its flat-index stagger, plays for all of them in the new reading order.
A change in holdings (a new card, a raised count) does not bump the generation, so those
re-renders keep their DOM as they do today. The existing `prefers-reduced-motion` rule already
removes the animation.

**Alternatives:**

- Restart the animations imperatively with `element.getAnimations()` and
  `animation.play()` / `currentTime = 0`. This keeps the DOM but needs element refs and an
  `afterRender` hook, which is more machinery for the same visible result.
- FLIP. Out of scope (see Non-Goals).

**Cost.** A collection of a few dozen cards re-creates a few dozen card components per click. That
is cheap at the catalogue's size. Any open menu is already closed by `onSort`.

### 6. Deck selectors become `aria-pressed` toggle buttons, each its own tab stop

Drop `role="tablist"`/`role="tab"`, `aria-selected`, the roving tabindex, `onTabKeydown`, and
`.tab-mark`. Each deck becomes `<button class="deck-btn" [attr.aria-pressed]>` with
`aria-label="Deck N"`, and the visible label stays `Deck N` when selected and `N` otherwise. They
sit in a `role="group" aria-label="Your decks"`. With at most nine decks, plain tab stops are
acceptable and match "regular buttons".

**Styling.** The look comes from the deck bar's existing `.bar-control` vocabulary: closed 1px
border, 2px radius, uppercase UI type. The selected state uses a filled `--color-surface` ground,
a gold border, and weight 700. The unselected state uses a transparent ground and a dim border.
Filled versus hollow, and bold versus regular, are the non-colour cues.

**Alternative:** keep tab semantics under a button skin. Rejected because the request was for
regular buttons, and a tablist without tabpanel behaviour is semantics the screen does not honour.

### 7. One centred row: buttons, then separator and controls, kept together

`.tab-row` becomes `display: flex; flex-wrap: wrap; justify-content: center; align-items: center`,
with no `flex: 1` strip. The deck buttons come first, followed by a single `.deck-controls-unit`
(`display: flex; flex: none`) that holds `.controls-sep` and `.deck-controls`. Because the unit
does not split, a wrap can never strand the separator away from the controls. The whole row
re-centres as decks are added. The tooltip moves from `right: 0` to centred under its button
(`left: 50%; translate(-50%)`), now that the button is no longer at the row's edge.

### 8. The limit disables with `aria-disabled`, not `disabled`

At `MAX_DECKS` the + button stays rendered with `aria-disabled="true"`, a `.is-disabled` style
(dimmed, `cursor: not-allowed`, no hover glow), `data-tip="9 decks is the limit"`, and
`aria-describedby` pointing at a visually hidden span with that text. The click handler returns
early, and `createDeck` in the model refuses anyway. The native `disabled` attribute is not used:
it removes the button from the tab order, and in some browsers it suppresses hover, which would
hide the very tooltip that explains the limit. `.bar-note` is deleted.

### 9. Reset is `UserService.reset()`, confirmed through a shared dialog

`reset()` sets `_state` to `seedUser()` and calls `persist()`. It is the same path `load()` takes
for a new player, so "exactly what a new player holds" is true by construction. The page's
`onReset()` then sets `selectedDeck` to 0, sets `sort` to the default, closes the menu and the
reader, and bumps `sortGeneration`.

Extract the deck bar's confirm markup into `src/components/confirm-dialog/` with these parts:

- inputs: `message`, `confirmLabel`, `cancelLabel`, `tone` (`'danger'`)
- outputs: `confirm`, `cancel`

On open, focus moves to the cancel button. Focus is confined while the dialog is open, Escape
cancels, and focus returns to the opener when it closes. Delete-deck and reset both use it.

**Placement.** The reset control sits at the trailing end of the sort row, after a gap. It is a
small `.bar-control` with a dashed border and a `Debug` chip before the label `Reset data`, which
marks it as tooling and keeps it apart from the deck controls. Its confirmation text:

> Reset all data? Your cards, Geo, and decks will be replaced with a new player's.

### 10. Badge: `used / held`, with exhaustion shown by inversion and a mark

With a deck selected, the badge reads `<used> / <held>`. The used figure is set in the soul colour
at regular weight, and the held figure in gold at a heavier weight, so held reads as the primary
number. The accessible name is `<used> of <held> in Deck N`. When `used === held`, the pill
inverts to a filled ground with dark text and gains a leading `✓`. Inversion is a luminance cue,
and the mark is a shape cue, so the state survives with colour removed. With no deck selected the
badge reads `×<held>`, as today. The badge keeps its current anchor in the S–SE rim gap. The
existing "badge obscures nothing" e2e test guards the wider pill.

### 11. Persistence trims excess copies in `fromPersisted`

Inside the existing per-deck loop, keep a `Map<CardKey, number>` of copies kept so far. A position
is kept only while that count is below the restored collection's quantity. The earliest copies
win, and the deck's relative order is preserved. No schema version bump is needed, because the
stored shape is unchanged and only what is accepted from it narrows.

## Risks / Trade-offs

- **Existing players' decks shrink on next load.** A player who used the old rule (nine Crawlids
  from one copy) loses the excess copies, and the deck becomes Incomplete. → This is the stated
  behaviour, and it is the only way to keep the invariant. Pre-release data and a reset control
  make it painless.
- **Existing e2e tests rely on the unlimited rule.** Tests such as "removing the second of three
  copies" and the nine-adds deck-fill add one starter card repeatedly. → They will seed quantities
  through `openCardsAs`, or add nine distinct starters. The tasks list each test affected.
- **Re-keying on sort throws away focus inside the grid.** → Sorting is done from the sort
  buttons, so focus is never inside the grid at that moment. Any open menu is closed first.
- **A wider badge could clip a chevron at the minimum tile width.** → It keeps the current anchor
  and font size. The existing badge-geometry e2e test fails if it overlaps, and a 3-digit held
  count is not reachable with today's pack economy.
- **Accessible names of sort buttons gain a direction suffix.** → Playwright's `getByRole` name
  match is substring by default, so `{ name: 'Rarity' }` still matches. Any `exact: true` usage is
  updated.

## Migration Plan

There is no data migration step. The over-limit trim (Decision 11) runs on every load. Rollback
is a code revert. Data trimmed by the new rule is not restored by a rollback, which is acceptable
for pre-release data.
