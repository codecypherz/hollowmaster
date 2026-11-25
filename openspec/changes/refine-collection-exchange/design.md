## Context

See proposal.md for motivation and the specs for behaviour. What shapes the approach:

- `exchange.ts` prices by `ROSARY_PRICE_PER_STAR = { sell: 10, buy: 100 }`. Every price already goes
  through `unitPrice`, `salePrice`, or `purchasePrice`, so the rate table has one place to land.
- `UserService` changes state in five places: `load`, `reset`, `creditGeo`, `grantCards`/`purchase`,
  and `apply` (decks and `settle`). Nothing passes through a single point today.
- `parsePersistedUser` reads `rosaries` only when the version equals `SCHEMA_VERSION`, and treats
  every earlier version as holding none. Raising the version without changing that line would zero
  every player's Rosaries.
- `QuantityStepper` is stateless and shared by the tile and the dialog. Its value is a `<span>`.
- `trapTab` finds only `button` stops, so a field in the cart dialog would fall outside the trap.
- `CardReader` already supports having no action (only Close). It is used only by `Decks`.
- The card renderer's button always carries `aria-pressed`. Collection tiles render the card as
  display only, with no button.
- Collection tiles have 180px of inner width. The rows now need up to a four-digit price as well.
- The Decks badge's exhausted state already inverts its fill as well as drawing the check, so
  removing the check leaves a lightness cue.
- No catalogued card has six stars, so the rarity 6 rules need fixture cards or direct model tests.

## Goals / Non-Goals

**Goals:**

- One table and one "is this rate known" rule, both pure functions that the model itself enforces.
- Milestones that can't be missed by a new way of gaining cards or Rosaries.
- One typed-quantity implementation for both surfaces.

**Non-Goals:**

- A general popover, tooltip, or number-input primitive.
- Arrow-key stepping or press-and-hold in the quantity field.
- Changing how `app-rosary` announces an amount of one.

## Decisions

### The rate table is keyed by rating and checked at load

`exchange.ts` replaces `ROSARY_PRICE_PER_STAR` with a frozen `ROSARY_RATES`, a record from each
rating to `{ sell, buy }`. `salePrice`, `purchasePrice`, and `unitPrice` look it up. A module-load
assertion, like `assertCatalogueSets`, checks that every rating from `STARS_MIN` to `STARS_MAX`
(exported from `card.ts`) has whole-number rates with sell below buy. The dropdown lists
`rosaryRates(state)`, which is the table filtered by the rule below.

*Alternative: store prices on `Card`.* Rejected. The card model has exactly nine properties, and the
request is for a rate per rarity.

### Milestones are two raw facts, raised at one point

`UserState` gains `milestones: { peakRosaries, rarestHeld }`. A pure `withMilestones(state)` in
`user.ts` returns the state with each raised to what it now proves, and the same object when nothing
changes. `rarestHeld` is 0 for an empty collection.

`UserService` gets one private `commit(next)` that applies `withMilestones`, sets the signal, and
persists. Every mutator goes through it. `seedUser` and `fromPersisted` call `withMilestones`
themselves, so a seeded or upgraded user is right without a service.

*Alternative: one boolean, "rarity 6 known".* Smaller, but it stores the conclusion. The facts stay
true if the threshold is ever tuned.

*Alternative: raise them inside `grantAll` and `settleOrder`.* Rejected. The next operation to grant
cards would have to remember to.

### `knowsRate` is the only gate, and the model enforces it

`exchange.ts` exports `knowsRate(state, stars)`: true below `SECRET_RARITY` (6), otherwise
`rarestHeld >= 6 || peakRosaries >= SECRET_RATE_PEAK` (9999). The peak is its own constant and is not
read from the buy rate. They match today, but one is a price and the other is a milestone.

`settleOrder` refuses a purchase of a card whose rate is not known, judged on the state it was given.
In the cart, `maxPending`, `raiseRefusal`, and `setQuantity` take whether the rate is known, so a
hidden purchase's bound is 0 and its reason reads `You do not know its price yet`. `CartService`
supplies it. Sales need no gate: holding the card is what makes its rate known. A cart line can't
outlive its knowledge either, because only a reset lowers milestones and a reset clears the cart.

### Schema version 4

`SCHEMA_VERSION` becomes 4, with `VERSION_WITHOUT_MILESTONES = 3`. `rosaries` is read for versions 3
and 4 and is zero for 1 and 2. `PersistedUser` gains `milestones`. Each field is parsed alone: a value
that isn't a possible one reads as 0, and `withMilestones` in `fromPersisted` lifts it. That gives
the upgrade from older versions, the "never below what is held" rule, and the "costs only itself"
rule from one mechanism. Dropped unknown cards prove nothing, which is the existing rule for them.

### One formatter for the collection number

`card.ts` gains `collectionNumber(card)`, returning `FC #1`. The Collection tile and the card's
accessible description use it. The card plate keeps its two spans (`.cf-set`, `.cf-number`), and the
second becomes `#1`. `CardKey` already looks like `FC#1`, but it is an identity and is not shown.

### The stepper owns a draft, and nothing else

`QuantityStepper`'s value becomes `<input type="text" inputmode="numeric" class="value hk-seg-field">`
with a `draft` signal (string or null) and an `entered` output. It stays ignorant of bounds and cards.

- `input` strips non-digits, writes the cleaned text back to the element, and sets the draft. The
  explicit write matters: if cleaning leaves the bound value unchanged, Angular won't rewrite the DOM.
- Enter and blur call one `commitDraft()`. It clears the draft and emits only if the text is
  non-empty and differs from the value. With no draft it does nothing, so Enter then blur emits once.
- Escape with a draft clears it and stops propagation. Without a draft it propagates, so the cart
  dialog still closes. This order also stops a dialog's destruction from committing an edit.
- A press on plus or minus blurs the field first, so it carries on from what was typed.
- `editable` false uses `readonly` and `aria-disabled`, not `disabled`, so the field stays focusable.

The parents call `cart.setQuantity`, which already clamps. The dialog raises zero to `LEAST` first.
Neither announces when the quantity didn't change.

*Alternative: `type="number"`.* Rejected. Spinner chrome, wheel changes, and `e`, `+`, `-` as legal
input all work against a three-digit segment.

*Alternative: commit on each keystroke.* Rejected. Typing 12 would pass through 1, could clear the
other row on the way, and would announce every digit.

### The trap learns about fields

`trapTab` looks for `button, input`. `CardReader` has its own trap over `button, [href]` and no
fields, so it is left alone.

### The segmented bar is a primitive

`primitives.css` gains `.hk-seg`, a flex row whose children are `.hk-btn.sm` and `.hk-seg-field`.
Segments overlap by one pixel to share a rule, and a hovered or focused segment is raised by
`z-index` so its border and outline are complete. The accent is two custom properties, gold by
default and soul with `.hk-seg.soul`. An unavailable segment dims its label, not its border, because
the button primitive's `opacity: 0.4` would break the bar's outline.

The stepper's host is the bar. The tile's `↓9`/`↑9` button is projected into it as an end cap, so the
bar stays one element in the DOM and the dialog simply projects nothing.

*Alternative: style it in the stepper.* Rejected. The button spec forbids a surface declaring its own
button style, and two surfaces use this.

### Row layout

Each row is two columns: a 44px label cell and the bar. The label cell stacks the label over the
price, and the warning mark's reserved slot sits beside the label. `9999` and its mark measure about
38px at 0.6rem. The bar gets about 130px for four segments, enough for a three-digit field. The
visible price is `aria-hidden`, and the row keeps its hidden description in words, through one helper
that also handles the singular ("1 Rosary each"). The confirm label and effect text use that helper
too, since amounts of one are now possible. The price `title` goes, because the price is on screen.

If the measured row doesn't fit, `--tile-w` grows. Tiles already have a one-property width.

### The purse is a disclosure, not a menu

`src/components/exchange-rates/` draws the purse button and its panel: `aria-expanded`,
`aria-controls`, and an accessible name of `Your Rosaries, 450`. The panel is a `<table>` with Rarity,
Sell, and Buy headings, absolutely positioned under the button and aligned to its right edge, so it
can't move anything. It closes on Escape (returning focus), on an outside click, and on focus leaving.
The top bar takes a stacking order above the sections, whose tiles animate with transforms. Roles of
`menu` or `dialog` would promise choices or a focus trap that this doesn't have.

### Cards that read declare it

`CardComponent` gains `opensDialog`. When set, the button carries `aria-haspopup="dialog"` and drops
`aria-pressed`. Deck, collection-grid, and Collection tiles set it along with `interactive` and
`selectable`. The hand rack and board are unchanged.

### `CardMenu` is deleted, and its actions move beneath the card

`openMenu`, `toggleMenu`, `dismissMenu`, and the document click handler leave `Decks`. `reading`,
`restoreFocus`, and the reader stay. The tile's `addReason` feeds both the always-visible button and
the reader, as it did for the menu, so the two still can't disagree.

Add uses `hk-btn sm` with `aria-disabled`, a `title`, and a hidden description, as the exchange
controls do. Its accessible name is `Add to Deck 1: Crawlid`, which starts with its visible label.
Remove is named `Remove Crawlid from Deck 1`. In the deck row, every position is the card plus a
fixed-height strip, and `--deck-ch` and the region's height include the strip. It scales with the row,
so `regionScale` needs no new input.

After a removal, `Decks` focuses the Remove button now at that position, else the last one, else the
selected deck button. It uses `afterNextRender`, as the cart dialog's row removal does.

## Risks / Trade-offs

- [Balances earned at the old rates are worth far more now: 100 Rosaries bought one common card and
  now buys 25] → Accepted; proposal.md lists it as a non-goal. Nothing is lost, and the Decks reset
  is there for testing.
- [Players holding 9999 or more under the old rates know the rarity 6 rate at once] → This follows
  the rule as stated. They have possessed that many.
- [The pinned deck region grows by the Remove strip, leaving less of the collection visible on short
  viewports] → The fit ladder in `e2e/decks.spec.ts` is re-run at every size. The strip uses the
  compact button.
- [Many more tab stops: one per card and per button] → Required by keyboard access. The order follows
  reading order.
- [The rows are tight at 180px with prices] → An e2e check asserts that nothing overflows at the
  largest catalogued price and a three-digit quantity, plus a style-guide example at 9999.
- [The rarity 6 paths have no real card] → Model tests cover `knowsRate`, `rosaryRates`, and
  milestones directly. Refusal, cart, and tile tests use a Vitest helper that adds a six-star card to
  `CARD_DB` and `CARD_BY_KEY` for one test and takes it out again. Production code gets no seam. The
  browser suite can't cover a hidden tile price until a six-star card exists, and covers the dropdown.

## Migration Plan

Version 1 to 3 records upgrade on load and are rewritten at version 4. Rolling back to a build that
knows only version 3 would treat a version 4 record as unrecognised and seed a new user, as with
every earlier schema change. Archive `add-collection-cart` before this change so its deltas don't
land on top of these.
