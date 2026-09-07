import { expect, test } from '@playwright/test';
import { arena, startMatch } from './helpers';

test.describe('the guard-gated route into the match', () => {
  test('starting a match from Battle reaches the in-game screen', async ({ page }) => {
    await startMatch(page);

    await expect(page).toHaveURL(/\/game$/);
    await expect(arena(page)).toBeVisible();
    await expect(page.getByLabel('Game board')).toBeVisible();
  });

  test('navigating straight to the in-game route redirects to Battle', async ({ page }) => {
    // A fresh context: no match has been started, so the guard has nothing to
    // let through.
    await page.goto('/game');

    await expect(page).toHaveURL(/\/battle$/);
    await expect(page.getByRole('button', { name: 'Start Game' })).toBeVisible();
    await expect(arena(page)).toHaveCount(0);
  });

  test('retreating returns to Battle and re-blocks the in-game route', async ({ page }) => {
    await startMatch(page);

    await page.getByRole('button', { name: 'Retreat' }).click();
    await expect(page).toHaveURL(/\/battle$/);
    await expect(page.getByRole('button', { name: 'Start Game' })).toBeVisible();

    // The match is over, so the route is closed again.
    await page.goto('/game');
    await expect(page).toHaveURL(/\/battle$/);
    await expect(arena(page)).toHaveCount(0);
  });
});
