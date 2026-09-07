import { expect, test } from '@playwright/test';

/**
 * The first proof the harness launches at all: the app loads, the router sends
 * the root path to Battle, and Battle's primary action is on screen.
 */
test('the app loads and lands on Battle', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveURL(/\/battle$/);
  await expect(page.getByRole('button', { name: 'Start Game' })).toBeVisible();
});
