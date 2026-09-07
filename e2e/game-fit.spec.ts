import { expect, test } from '@playwright/test';
import {
  arena,
  columns,
  expectNoScroll,
  expectNothingClipped,
  label,
  startMatch,
  type Size,
} from './helpers';

/** The sizes the in-game screen is expected to be looked at on. */
const LADDER: Size[] = [
  { width: 1920, height: 1080 },
  { width: 1600, height: 900 },
  { width: 1440, height: 900 },
  { width: 1366, height: 768 },
  { width: 1100, height: 620 },
];

/**
 * Smaller than the arena needs at the card renderer's 120px minimum — the arena
 * is 11 × 7 card units plus 48px of chrome, so it wants 1368 × 888 before any
 * scaling. `game/screen` requires this viewport to scale the arena rather than
 * break it.
 */
const SUB_MINIMUM: Size = { width: 900, height: 600 };

test.describe('the in-game arena fits the viewport', () => {
  for (const size of LADDER) {
    test(`at ${label(size)} the page does not scroll and nothing is clipped`, async ({ page }) => {
      await page.setViewportSize(size);
      await startMatch(page);

      await expectNoScroll(page);
      await expectNothingClipped(page, size);

      // A review artifact, not a baseline: written to the run's output
      // directory for a person to look at, never compared to a stored image.
      await page.screenshot({ path: test.info().outputPath(`arena-${label(size)}.png`) });
    });
  }

  test(`at ${label(SUB_MINIMUM)} the arena is scaled rather than reflowed`, async ({ page }) => {
    await page.setViewportSize(SUB_MINIMUM);
    await startMatch(page);

    // Scaled, not re-laid-out: the card unit stays at the renderer's minimum
    // and the shortfall is expressed as a uniform transform on the arena.
    await expect(arena(page)).toHaveClass(/arena-scaled/);
    const scale = await arena(page).evaluate(
      (el) => Number(getComputedStyle(el).getPropertyValue('--arena-scale')),
    );
    expect(scale).toBeGreaterThan(0);
    expect(scale).toBeLessThan(1);

    // The four columns are all still there, in order, left to right.
    const { codex, playerRack, board, opponentRack } = columns(page);
    const lefts = [];
    for (const column of [codex, playerRack, board, opponentRack]) {
      const box = await column.boundingBox();
      expect(box).not.toBeNull();
      lefts.push(box!.x);
    }
    expect(lefts).toEqual([...lefts].sort((a, b) => a - b));
    expect(new Set(lefts).size).toBe(4);

    await expectNoScroll(page);
    await expectNothingClipped(page, SUB_MINIMUM);

    await page.screenshot({ path: test.info().outputPath(`arena-${label(SUB_MINIMUM)}.png`) });
  });

  test('a resize refits the arena in both directions', async ({ page }) => {
    const wideAndShort: Size = { width: 1680, height: 720 };
    const narrowAndTall: Size = { width: 1024, height: 1180 };

    await page.setViewportSize(wideAndShort);
    await startMatch(page);
    await expectNoScroll(page);
    await expectNothingClipped(page, wideAndShort);

    // The same match, resized — no reload, so the refit is the running screen's.
    await page.setViewportSize(narrowAndTall);
    await expectNoScroll(page);
    await expectNothingClipped(page, narrowAndTall);

    await page.setViewportSize(wideAndShort);
    await expectNoScroll(page);
    await expectNothingClipped(page, wideAndShort);
  });
});
