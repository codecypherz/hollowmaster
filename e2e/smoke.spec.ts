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

/**
 * The Decks page was the Cards page. An address saved before the rename still
 * lands there, and the nav marks it once the redirect settles.
 */
test('the former Cards route lands on the Decks page', async ({ page }) => {
  await page.goto('/cards');

  await expect(page).toHaveURL(/\/decks$/);
  const nav = page.getByRole('navigation', { name: 'Primary' });
  await expect(nav.getByRole('link', { name: 'Decks' })).toHaveAttribute('aria-current', 'page');
  await expect(nav.getByRole('link', { name: 'Cards' })).toHaveCount(0);
});
