## Context

See proposal.md for motivation and the specs for behaviour. What shapes the approach:

- `Collection` (`src/components/collection/`) holds only an announcement. It derives everything else
  from `UserService` through `computed`, and calls `buyCard` / `sellCard`, which each commit one pure
  function from `src/model/exchange.ts` through `UserService.apply`. Nothing else in the app calls
  those two commands; the remaining callers are Vitest specs.
- `trimDecks(decks, key, quantity)` already trims to any target quantity, so selling several copies
  needs no new trimming logic. `decksTrimmedBySale` is fixed at one copy.
- Tiles are 150px wide on a fixed grid track. The card renderer shows its ability section from 200px
  and has a 120px minimum, and the card must not change.
- The top bar is a two-column grid: the single-line header, then the purse.
- Every button uses the `hk-btn` primitive. `hk-btn.sm` and its `aria-disabled` treatment already
  exist for controls that are unavailable but focusable.
- `ConfirmDialog` and `CardReader` each carry their own Tab trap. `ConfirmDialog` also returns focus
  to its opener and is fixed above the page at z-index 70/71.

## Goals / Non-Goals

**Goals:**

- Cart rules live in pure functions with no Angular in them, as `deck.ts` and `exchange.ts` do.
- The tile row and the dialog row share one stepper and one set of bounds, so they can't disagree.
- A confirmed cart is one `UserService` state update and one persisted write.

**Non-Goals:**

- A generic modal or quantity-picker primitive in the design system.
- Reconciling carts across browser tabs.

## Decisions

### The cart is its own root service over a pure model

`src/model/cart.ts` holds the model: `CartLine { key, action: 'sell' | 'buy', quantity }`, and pure
functions over `readonly CartLine[]` (`setQuantity(lines, key, action, quantity, held)`, `remove`,
`quantityFor`). `setQuantity` clamps to the direction's bound (held for a sale, `MAX_PENDING_BUY = 99`
for a purchase), replaces a line in place when its direction changes, and removes it at zero. An
array rather than a map keeps "order first added" explicit and is small enough to scan.

`src/services/cart.service.ts` (`providedIn: 'root'`) holds one private signal of lines and exposes
`computed` views joined with `UserService.state()`: rows with the card, effect, bound, and trimmed
decks; `count`; `net`; `balanceAfter`; `shortfall`; `canConfirm`. Its `lines` view clamps each sale
to the copies currently held and drops those left at zero, which satisfies the spec's reduction rule
without an effect. Root scope is what makes the cart survive navigation and vanish on reload.

*Alternative: put the cart on `UserState`.* Rejected. It would be persisted, need a schema bump, and
put an uncommitted intent in the one record every surface treats as fact.

*Alternative: state on the `Collection` component.* Rejected. It is lost on navigation.

### Settling replaces the one-copy commands

`exchange.ts` gains `settleOrder(state, order): UserState | null`. It refuses (returns `null`) on a
non-positive or fractional quantity, a card listed twice, a sale above the copies held, or a negative
resulting balance. Otherwise it returns one new state with the collection, Rosaries, and decks
(`trimDecks` to each sold card's final quantity) all changed. `UserService.settle(order)` commits it
through `apply`. `buyCard` and `sellCard` are removed from both files; keeping them would leave two
paths to the same change, one of them unused. `decksTrimmedBySale` takes a quantity.

Sales and purchases are netted as a single sum, so the order of lines can't matter.

### Reset empties the cart from the Decks page

`Decks.onReset()` calls `cart.clear()` beside `users.reset()`. *Alternative: `UserService.reset`
clears the cart.* Rejected, because `CartService` depends on `UserService` and the dependency would
become circular.

### One stepper component, used in both places

`src/components/quantity-stepper/` draws minus, value, plus as `hk-btn sm` controls. Inputs: value,
whether each end is available, its reasons, and the accessible labels. Outputs: `increase` and
`decrease`. It holds no state. Unavailable controls use `aria-disabled`, not the native `disabled`,
so a press that reaches a bound keeps focus. The value is shown as text, in tabular numerals in a
box wide enough for two digits. A held count can exceed 99, so the box grows to three digits only
for sales, inside the row's reserved slack.

### The frame is the tile; the card keeps its 150px

`.tile` becomes the frame: 200px wide with 10px side padding, a token border, and a surface ground.
`app-card` sits centred at its current 150px, so the renderer sees the same width as today and the
no-ability band is untouched. The veil stays scoped to `.tile-card`. The badge keeps its place on
the card's lower rim. 200px tiles give five columns at 1100px and eight at 1920px.

Each row is a grid of fixed columns: label with a reserved slot for the warning mark, stepper, and
the `↓9` / `↑9` control. Fixed columns keep the two rows aligned, as in the sketch, and keep the
warning mark from moving anything. The estimate for the row is about 178px against 180px inner
width. If the measured row doesn't fit, the frame grows; the button primitive is not given new
metrics.

### `9` is the deck size

The target is `DECK_SIZE`, imported from `deck.ts`, because nine is the most copies any one deck can
use. The label's numeral, the reasons, and the arithmetic all derive from it. `↓9` sets
`held - DECK_SIZE` to sell; `↑9` sets `DECK_SIZE - held` to buy. Both work from the copies actually
held, not from what is pending, and set the quantity rather than adding to it.

### Prices on the tile are tooltip and description only

The sketch shows no price, so the row carries one as `title` and as its accessible description. The
visible tooltip says `Sells for 10 each` without the currency word, because the Rosary primitive
forbids setting that word beside a number on screen. Accessible text does say `10 Rosaries each`, as
accessible names already do. Amounts are drawn with `app-rosary` in the dialog.

### Signed amounts put the sign outside the primitive

`app-rosary` stays as numeral then mark. The dialog writes `+` or `−` (U+2212) immediately before it
in one unbreakable inline, and a sibling `sr-only` phrase states it in words. No change to the
primitive. Gains and spends may also differ in colour, but the sign carries the meaning.

### The dialog follows `ConfirmDialog`, with the trap shared

`src/components/cart-dialog/` is a `role="dialog"`, `aria-modal` overlay rendered by `Collection` at
the same layer as `ConfirmDialog`. It is a three-row grid: title and close control, the scrolling
rows, and the totals with confirm. The Tab trap is extracted from `ConfirmDialog` to a small function
in `src/components/focus-trap.ts` and used by both. `CardReader` keeps its own for now, since this
change doesn't otherwise touch it. `ConfirmDialog` itself isn't reused because its one message and
two buttons don't fit a list.

The opener focus return is the same microtask pattern. On confirm, the dialog emits, `Collection`
calls `cart.confirm()`, closes the dialog, and sets the announcement. `cart.confirm()` clears the
lines only if `settle` returned true, and returns a summary (sold, bought, net, trimmed decks) read
before settling.

The page's polite live region stays outside the dialog. Because `aria-modal` can hide content behind
it from assistive technology, the dialog has its own live region for quantity changes made inside it.

### The cart control takes a first column in the top bar

The top bar's grid becomes `auto minmax(0, 1fr) auto`: cart, header, purse. The header's rules give
way first, as they do today, so nothing can overlap. The control is an `hk-btn sm` with an inline SVG
and the count.

## Risks / Trade-offs

- [The player can't see a price on the tile at a glance, and not at all on touch] → Follows the
  sketch. The cart shows every amount before anything is committed. A visible price can be added to
  the row labels later without changing the model.
- [The rows are tight at 200px] → An e2e check asserts that nothing overflows the frame, including
  three-digit sale quantities and the warning mark. The frame width is one custom property.
- [Fewer tiles fit than before, because tiles are wider and taller] → The sections already scroll,
  and the fit specs are re-run at both viewports.
- [Deck warnings appear only once a sale is pending, not before] → Nothing is lost until confirm, and
  the cart row repeats the warning in visible text.
- [Removing `buyCard` and `sellCard` touches existing specs] → Their cases are moved onto
  `settle`/`settleOrder` in the same task, so coverage isn't lost.

## Migration Plan

No stored data changes. Rolling back is reverting the commit.
