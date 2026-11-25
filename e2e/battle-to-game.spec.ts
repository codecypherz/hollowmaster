import { expect, test } from '@playwright/test';
import { arena, startMatch } from './helpers';

test.describe('the guard-gated route into the match', () => {
  test('Start Game leads to deck selection and starts no game', async ({ page }) => {
    await page.goto('/battle');
    await page.getByRole('button', { name: 'Start Game' }).click();

    await expect(page).toHaveURL(/\/battle\/deck$/);
    await expect(page.getByRole('heading', { name: 'Choose a Deck' })).toBeVisible();
    await expect(arena(page)).toHaveCount(0);

    // No game was started, so the in-game route is still closed.
    await page.goto('/game');
    await expect(page).toHaveURL(/\/battle$/);
  });

  test('starting a match through deck selection reaches the in-game screen', async ({ page }) => {
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
