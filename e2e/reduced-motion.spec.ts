import { expect, test } from '@playwright/test';
import {
  PACK_SIZE,
  buyPack,
  collected,
  expectNoScroll,
  expectNothingClipped,
  grantGeo,
  openShop,
  revealedCards,
  revealedRarities,
  startMatch,
  type Size,
} from './helpers';

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

test('a pack opens without animated arrival, and still reads as rare', async ({ page }) => {
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(
    true,
  );

  await page.setViewportSize(VIEWPORT);
  await openShop(page);
  await grantGeo(page);
  await buyPack(page, 'level-3');

  // The preference collapses the sequence: the result is present at once
  // rather than arriving over five staged beats.
  await expect(revealedCards(page)).toHaveCount(PACK_SIZE);
  await expect(page.getByRole('button', { name: 'Return to the Shop' })).toBeVisible();

  // The same common-to-rare order the animated sequence would have used.
  const rarities = await revealedRarities(page);
  expect(rarities).toHaveLength(PACK_SIZE);
  for (let i = 1; i < rarities.length; i++) {
    expect(rarities[i]).toBeGreaterThanOrEqual(rarities[i - 1]);
  }

  // Nothing is animating, and nothing is mid-transition.
  const animating = await collected(page).evaluateAll((els) =>
    els.map((el) => {
      const style = getComputedStyle(el.querySelector('.card-reveal')!);
      return {
        animation: style.animationName,
        transition: style.transitionDuration,
        opacity: style.opacity,
      };
    }),
  );
  for (const card of animating) {
    expect(card.animation).toBe('none');
    expect(Number.parseFloat(card.transition)).toBe(0);
    expect(card.opacity).toBe('1');
  }

  // The rarity emphasis is not carried by the motion, so removing the motion
  // leaves it: every card still states its rarity and still carries its glow.
  const emphasis = await collected(page).evaluateAll((els) =>
    els.map((el) => ({
      stars: el.getAttribute('data-stars'),
      klass: el.className,
      label: el.querySelector('.rarity-label')?.textContent?.trim() ?? '',
      glow: getComputedStyle(el.querySelector('.card-reveal')!).filter,
    })),
  );
  for (const card of emphasis) {
    expect(card.klass).toContain(`rarity-${card.stars}`);
    expect(card.label).toBe(`${card.stars}-star`);
    expect(card.glow).not.toBe('none');
  }

  // And the surface still fits.
  await expectNoScroll(page);
});
