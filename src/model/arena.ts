/* ─── Arena geometry ──────────────────────────────────────────────────────────
   The in-game screen is sized by one length: `--cw`, a card's laid-out width.
   Every column, gap, and cell on the screen is a multiple of it.

   The screen used to derive that length from a CSS `clamp()`. A `clamp()` can
   express "as large as the viewport allows, but never below the card's minimum"
   — and that is exactly the shape that clips, because once the floor wins the
   layout is wider than the viewport and nothing brings it back. The missing
   half is a second stage that scales the whole arena when the viewport cannot
   host it, and that stage is a ratio of two lengths, which CSS `calc()` cannot
   compute.

   So the geometry is computed here instead: given a viewport, this yields the
   unit to lay the arena out at and the factor to view it through. Both are then
   assertable in a unit test rather than checked by eye at a handful of window
   sizes.
   ──────────────────────────────────────────────────────────────────────────── */

/**
 * The card renderer's minimum supported width, in CSS pixels — see
 * `openspec/specs/design-system/card/spec.md`. A card is never *laid out*
 * below this: every width-gated decision the card makes (the ability section,
 * the ornament level, the name fitting) is decided at a width where the
 * renderer's own guarantees hold. Where the viewport cannot host the arena at
 * this unit, the arena is scaled as a whole instead.
 */
export const MIN_CARD_WIDTH = 120;

/**
 * The arena's extent in card units, from `design.md` decision 1:
 *
 * | Column       | Width      |
 * | ------------ | ---------- |
 * | Codex        | `3cw + 2g` |
 * | Hand rack ×2 | `2cw + g`  |
 * | Board        | `5cw + 4g` |
 *
 * and a height of five cells at the 2.5:3.5 ratio — `5 × 1.4cw = 7cw`.
 *
 * The codex is the wide column. It carries the two things on this screen that
 * are read rather than glanced at — the standing panel and the inspected card
 * — and both are sized from its width, so the unit it costs the rest of the
 * arena buys a card face that can actually be read.
 */
const ARENA_UNITS_W = 12;
const ARENA_UNITS_H = 7;

/**
 * Space the arena cannot use, in CSS pixels: the screen's outer frame, its
 * corner filigree, and the breathing room around the columns. Subtracted from
 * the viewport before it is divided into units.
 */
const CHROME_W = 52;
const CHROME_H = 48;

/**
 * Floor for the viewing scale. Only reachable at viewports smaller than the
 * chrome itself, where there is nothing sensible to show anyway; it exists so
 * a degenerate measurement can never yield a zero or negative transform.
 */
const MIN_SCALE = 0.05;

/** How the arena is laid out and viewed at a given viewport. */
export interface ArenaGeometry {
  /** `--cw`: a card's laid-out width in CSS pixels. Never below the minimum. */
  unit: number;
  /** `--arena-scale`: the uniform viewing transform. `1` when the arena fits. */
  scale: number;
}

/**
 * Fit the arena to a viewport.
 *
 * Two stages. The first asks how large a card unit the viewport could host,
 * taking whichever of height and width is scarcer — so a wide, short viewport
 * is bound by its height and a narrow, tall one by its width. The second floors
 * that unit at the card's minimum and expresses the shortfall, if any, as a
 * uniform scale: the arena is still laid out at a legible card size and then
 * viewed smaller, rather than re-laid-out at a size where the card renderer
 * stops holding its promises.
 *
 * The scale is quantised to two decimals so that a given viewport always
 * rasterises identically instead of shimmering across sub-pixel values. It is
 * rounded *down* so quantisation can never round a near-fit up to `1` and let
 * the arena spill past the viewport edge by the rounding error.
 */
export function fitArena(viewportWidth: number, viewportHeight: number): ArenaGeometry {
  const ideal = Math.min(
    (viewportHeight - CHROME_H) / ARENA_UNITS_H,
    (viewportWidth - CHROME_W) / ARENA_UNITS_W,
  );

  const unit = Math.max(MIN_CARD_WIDTH, ideal);

  /* `ideal === unit` above the floor, so the scale is exactly 1 there and the
     transform is dropped entirely rather than applied as a no-op. */
  const scale = clamp(floor2(ideal / unit), MIN_SCALE, 1);

  return { unit, scale };
}

function floor2(n: number): number {
  return Math.floor(n * 100) / 100;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}
