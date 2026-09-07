import { expect, test } from '@playwright/test';
import { expectNoScroll, expectNothingClipped, startMatch, type Size } from './helpers';

/**
 * This spec runs only in the `reduced-motion` project, which expresses the
 * preference through the browser — see `playwright.config.ts`.
 */
const VIEWPORT: Size = { width: 1440, height: 900 };

test('a card can be played, and the screen still fits, under reduced motion', async ({ page }) => {
  // The browser is honouring the preference for this project.
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(
    true,
  );

  await page.setViewportSize(VIEWPORT);
  await startMatch(page);

  const centre = page.locator('app-game .board-cell[data-cell="2-2"]');
  await expect(centre).toHaveClass(/cell-empty/);

  // Choose a card, then the cell to play it into.
  await page.locator('app-game .rack-player .slot app-card .frame').first().click();
  await expect(centre).toHaveClass(/cell-placeable/);
  await centre.click();

  // The post-placement state is reached with the motion suppressed: the card is
  // on the board, and the position it came from is empty.
  await expect(centre).toHaveClass(/cell-occupied/);
  await expect(centre.locator('app-card')).toBeVisible();
  await expect(page.locator('app-game .rack-player .slot-empty')).toHaveCount(1);

  // And the fit still holds around it.
  await expectNoScroll(page);
  await expectNothingClipped(page, VIEWPORT);
});
