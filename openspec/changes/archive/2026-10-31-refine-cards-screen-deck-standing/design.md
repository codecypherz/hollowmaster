## Context

The decks change shipped the Cards page as it is now (see `openspec/specs/collection/spec.md`, which
was archived just before this change). Its pinned region is drawn by
`src/components/deck-bar/`:

- **The top row** (`.tab-row`) puts the tab strip, a `+ New deck` text button, and a
  `Delete Deck N` text button in one centred, wrapping flex row, separated only by an 8px gap.
- **The count line** (`.deck-count`) states "N of 9 positions filled", plus an empty or full note.
  `e2e/helpers.ts#filledCount` reads its `.count` span.
- **The header** is page-local (`.page-head`, `.page-title` in `collection.css`): a title followed
  by a five-element ornament, centred.

There is no header primitive. The Battle and Shop screens each declare a stacked hero header of
their own.

The model already has what standing needs. `Deck.cards` is a list of `CardKey`, `CARD_BY_KEY`
resolves a key to a `Card` with its `stars` (1 to 6, and the catalogue currently peaks at 4), and
`DECK_SIZE` is `HAND_SIZE`. Deck operations in `src/model/deck.ts` are pure functions over
`UserState` that return `null` to refuse.

The style guide reads every `--color-*` token from `:root` at runtime, so a new colour token shows
up there without a hand-written entry.

## Goals / Non-Goals

**Goals:**

- Standing is one pure, unit-tested function, and battle eligibility is a one-line reading of it.
- The rarity limit's two numbers are declared once, beside `DECK_SIZE` and `MAX_DECKS`.
- The page's words and colours for each problem are decided in one place: the deck bar.

**Non-Goals:**

- A deck picker on the Battle screen, and dealing from a deck. The rule is stated now, and the
  picker that consumes `isBattleReady` comes later.
- Marking invalid or incomplete decks on their *tabs*. Only the selected deck's standing is stated.
  Per-tab markers are an easy follow-up once this is in.
- Warning before an add that would make the deck invalid.
- Moving the Shop or Battle headers onto the new primitive. Neither is single-line by design.
- Converting the deck bar's local `.bar-control` and `.deck-tab` styles to the `hk-btn` primitive.
  That drift predates this change.

## Decisions

### 1. The rarity limit counts cards of *four stars or more*

The request says "more than 1 4-star card". The card model allows ratings up to 6. A limit that
caught 4-star cards but let any number of 5- and 6-star cards through would be backwards, so the
rule is "at most one card rated ≥ 4". It is declared as

`RARITY_LIMIT = { minStars: 4, allowed: 1 }`

in `deck.ts`, so tightening it later (say, 5★ allowed 0) changes one line.

**Alternative:** count exactly 4★. This was rejected because today's catalogue cannot tell the two
readings apart, and only the ≥ 4 reading still makes sense once higher ratings exist.

### 2. Standing is typed data, and the words live in the component

`deckStanding(deck): DeckStanding` returns an ordered list of problems:

```ts
type DeckProblem =
  | { kind: 'invalid'; rule: 'rarity'; held: number; allowed: number; minStars: number }
  | { kind: 'incomplete'; needed: number };
```

Invalid always comes first. `isBattleReady(deck)` is true exactly when that list is empty.

The function takes a `Deck` and not a `UserState`. Standing reads only the deck's own contents, so
it does not need the collection, unlike the editing operations. A key that resolves to no catalogue
card does not count toward rarity, but it still counts toward size, as it already does for
`cards.length`.

The deck bar turns each problem into a sentence, for example:

- "Invalid — 2 cards of 4★ or more; only 1 is allowed. Remove 1."
- "Incomplete — add 5 more cards from the collection below to battle with this deck."

**Alternative:** have the model return strings. This was rejected because copy is a UI concern.
Typed problems also let the Vitest suite assert `held`, `needed`, and the ordering without matching
text, and let a future Battle picker give its own short reason.

### 3. The rarity limit is not wired into `addCardToDeck`

The spec says building past the limit is allowed, so `addCardToDeck` is unchanged. The collection's
`canAdd` and `addReason` stay as they are, gated only on there being a deck and room in it. Standing
is a `computed` over the selected deck, so the error appears the moment the second 4★ lands.

### 4. Two new status tokens, set apart from gold and crimson

`--color-warning` (a clear yellow, lighter and greener than `--color-gold` #e8a03c, so it does not
read as ornament) and `--color-error` (a red with its own value, not `var(--color-crimson)`) go in
the `@theme` block of `tokens.css`. That makes them available both as custom properties and as
utilities, and gets them into the style guide's colour swatches automatically.

The error message is set more heavily than the warning: error-coloured text, a thin error-coloured
left rule, and a faint tint behind it. The warning is warning-coloured text with no rule and no
tint. That weight difference is what makes the warning read as softer, alongside the hue.

**The non-colour cue** is a leading word ("Invalid" or "Incomplete") plus a mark of a different
shape: a filled diamond for the error and an outlined triangle for the warning. Both marks are
inline SVG with `currentColor`.

**Ready** is a single muted line ("Ready for battle") in `--color-text-muted`, not a status colour.

**Alternative:** reuse crimson and gold. This was rejected because crimson already means "the
opponent's" on the board, and gold is the structural accent the tabs themselves use. A gold warning
would sit right beside a gold selected tab.

### 5. The standing line replaces the count line in place

`.deck-count` becomes `.deck-standing`, an `aria-live="polite"` list holding one item per problem
(or the single Ready line). It goes in the same slot under the positions, so the pinned region's
height is about what it was.

The empty-deck note is gone. The Incomplete warning ("add 9 more…") now says what it used to say.
The full-deck note is gone from this region too. "Deck N is full." still shows where adding is
withheld (the card menu and the reader), through `addReason`, which is unchanged.

### 6. The header is a CSS primitive in `primitives.css`, not a component

The existing visual primitives are CSS classes composed in markup: `.ornament`, `.corner`, `.hk-btn`.
The header follows the same pattern:

```html
<header class="screen-header">
  <span class="screen-header-rule" aria-hidden="true"></span>
  <h1 class="screen-header-title">Cards</h1>
  <span class="screen-header-rule is-end" aria-hidden="true"></span>
</header>
```

- **Layout:** the rules are `flex: 1 1 0; min-width: 0` (a gradient line ending in an `.orn-node`
  diamond), and the title is `flex: none; white-space: nowrap`. The rules shorten as the container
  narrows, and the title never wraps.
- **Heading level:** the host's markup decides it. The Cards page uses `<h1>`, and the style guide
  example uses `<h2 class="screen-header-title">`. A component would need a dynamic-heading input
  to do the same thing.
- **Title type:** it carries over what `collection.css` already sets on `.page-title` (display font,
  soul colour, glow). Those rules move into the primitive and are deleted from the page.

**Alternative:** an `app-screen-header` component. That is reasonable if the header ever gains
slots (a purse, a back control), but the Geo amount is the only primitive that warranted a
component, because it carries an image and an accessible name. This one is markup and style.

### 7. Tabs: the numeral alone unless selected, with the full name as the accessible name

Each tab renders `selected ? deckName(i) : String(i + 1)` and always carries
`aria-label="deckName(i)"`. The existing diamond `.tab-mark` is kept as the non-colour selection
cue.

Unselected tabs get a `min-width`, so a single-digit tab is a comfortable target rather than a
sliver.

### 8. Control group: icon buttons with a CSS tooltip, behind a separator

`.tab-row` becomes a two-part row:

- the tab strip (`flex: 1`, starting at the left), then
- a `.deck-controls` group, which is preceded by a 1px vertical rule in `--color-section-border` and
  a wider gap, and pinned to the row's end.

The group holds the + button, the trash button, and, at the deck limit, the "9 decks is the limit"
note in place of the +.

The icons are inline SVG paths in `deck-bar.html` (`aria-hidden`, `currentColor`, about 14px). Each
button carries `aria-label` ("New deck", or "Delete Deck N") and `data-tip` with the same text.

The tooltip is a `::after` reading `attr(data-tip)`, shown on `:hover` and `:focus-visible`. A
native `title` attribute was rejected because it never appears on keyboard focus, and the spec asks
for both. The tooltip is suppressed for reduced motion only to the extent that it appears without a
fade.

The confirm dialog keeps its text buttons. It is a sentence, not a toolbar.

## Risks / Trade-offs

- **Selecting a tab changes its width.** Going from `2` to `Deck 2` shifts the tabs after it, and
  the pointer may end up over a different tab. → Tabs only grow to the right, the selected tab stays
  under the pointer, and the shift is a few characters wide. This is accepted as the cost of the
  requested labelling.
- **Icon-only controls are less discoverable.** → They have tooltips on hover and focus, keep their
  accessible names, and use conventional glyphs (+ and trash).
- **Tests keyed on removed text break.** `filledCount` and the `'+ New deck'` role names are used
  across `e2e/cards.spec.ts` and `e2e/reduced-motion.spec.ts`. → Replace `filledCount` with
  `deckCards(page).count()` plus a new `deckStanding(page)` helper, and rename the role queries to
  `'New deck'`, in the same task that changes the markup.
- **The yellow warning sits near the gold selected tab.** → The warning hue is chosen visibly apart
  from gold, and is checked side by side on the style guide's swatch row and on the page itself.

## Migration Plan

No data migration. Standing is derived and never persisted, so decks already saved simply show
their standing on first load. A deck already holding two 4★ cards shows as Invalid, which is
correct. Rollback is a code revert.

## Open Questions

- The exact hex values of `--color-warning` and `--color-error` are tuned during implementation
  against the ground and the gold accent. The spec fixes their roles and relationships, not their
  values.
