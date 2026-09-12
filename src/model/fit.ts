/**
 * Fitting a laid-out surface into the space available to it.
 *
 * CSS cannot divide one length by another, so a surface that lays itself out
 * at a fixed unit — the pack opening's cards, the Cards page's deck row —
 * cannot ask the stylesheet how far to scale down when the viewport is too
 * small to host it. That ratio is computed here and handed back as a custom
 * property. `arena.ts` solves the same problem for the in-game board, in its
 * own terms; this is the general form for a surface that scales as a whole.
 */

/** Never scale to nothing, however degenerate the measurement. */
export const MIN_SCALE = 0.2;

/** A rectangle, in CSS pixels. */
export interface Extent {
  readonly width: number;
  readonly height: number;
}

/**
 * The uniform factor the overlay is viewed through: 1 wherever the available
 * space can host the laid-out surface, and the tighter of the two ratios where
 * it cannot. One factor on both axes, so the layout itself never changes and a
 * card is never re-fitted below the width its renderer's guarantees hold at.
 */
export function fitOverlay(available: Extent, needed: Extent): number {
  if (available.width <= 0 || available.height <= 0) return 1;
  if (needed.width <= 0 || needed.height <= 0) return 1;
  return Math.max(
    MIN_SCALE,
    Math.min(1, available.width / needed.width, available.height / needed.height),
  );
}
