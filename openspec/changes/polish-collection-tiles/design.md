## Context

See proposal.md for motivation. What shapes the approach:

- `collectionNumber(card)` in `card.ts` formats the number for the Collection tile and the card's
  accessible description. The card plate doesn't use it: it draws `.cf-set` and `.cf-number` as two
  flex items, and the visible space between them is `gap: 0.4em` on `.cf-plate`.
- `CardKey` is already spelled `FC#1`. It is an identity, and is not shown to the player.
- A Collection row is a grid of a 46px label cell, a 4px gap, and the bar. Inside the cell,
  `.row-head` is `auto 11px` with `justify-content: start`. The 11px track is the deck warning's slot,
  which is always reserved so that the mark's arrival moves nothing.
- Measured in the browser, from the frame's outer edge: the frame's border ends at 1px, the cell runs
  from 11 to 57, and the bar starts at 61. `SELL` is 23.3px wide, `BUY` 21.7px, and the widest price
  (`9999` and its mark) 38.8px.

## Goals / Non-Goals

**Goals:**

- The label and the price share one centre line, whether or not the row is warned.
- No bar moves and no tile changes size.

**Non-Goals:**

- Changing the letter-spacing of the collection number, or the spelling or use of `CardKey`.
- Changing the cart dialog, the exchange rates, or the bars.

## Decisions

### `collectionNumber` drops the space and stays separate from `cardKey`

The two now produce the same text. `collectionNumber` is kept, since one is display and the other a
storage identity, and its comment says so. The test that contrasts their spellings is reworded.

*Alternative: show `cardKey` directly.* Rejected. A later change to the display would then change
what saved collections resolve against.

### The plate loses its gap and keeps its two spans

`.cf-plate` drops `gap`. The set's letter-spacing remains as the ordinary spacing between characters.
The spans stay separate because the set truncates and the number doesn't.

### The column is the space the player sees

The cell has no drawn edges. What reads as the column is the space between the frame's left edge and
the bar's, from 1 to 61, whose centre is 31. The cell's own centre is 34, because the frame's 10px
padding is wider than the 4px gap. The cell is therefore widened to the left into that padding:
`.rows` takes `margin-left: -6px`, and the cell becomes 52px. It then runs from 5 to 57, 4px clear of
each edge, and the bar stays where it is.

*Alternative: centre in the existing 46px cell.* Rejected. The content would sit 3px right of centre,
and there is no room for the warning mark: it would end at about 61, against the bar.

### The warning's slot is balanced, not counted

`.row-head` becomes `minmax(0, 1fr) auto minmax(0, 1fr)` with a 3px column gap. The label takes the
middle track and the slot the third, aligned to its start. The slot keeps its 11px size and its place
in the layout. The equal outer tracks put the label on the centre line, and the price spans all three
with `text-align: center`. 11 + 3 + 23.3 + 3 + 11 = 51.3px, which fits the 52px cell.

*Alternative: centre the label and slot as a pair.* Rejected. The slot is nearly always empty, so the
label would look about 7px left of the price below it.

*Alternative: position the mark absolutely.* Not needed. The grid keeps it in the layout, which is
how "a warning arriving moves nothing" holds today.

## Risks / Trade-offs

- [The label and mark fit with under 1px to spare, and a wider fallback font could push the mark
  right] → The outer tracks may shrink to zero, and the 4px gap before the bar absorbs the overflow.
  The existing browser check that the mark ends before the bar stays in force.
- [`add-collection-cart` and `refine-collection-exchange` are synced but not archived, and their
  deltas state the same requirements with the older text. Archiving either with a spec sync after
  this change is synced could restore `FC #1`] → Archive both before syncing or archiving this
  change, or archive them without updating the specs.
