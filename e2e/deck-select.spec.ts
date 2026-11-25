import { expect, test, type Locator, type Page } from '@playwright/test';
import {
  CARD_MIN_WIDTH,
  DECK_SIZE,
  READY_STARTER_USER,
  STARTER_REFS,
  arena,
  cardButton,
  cardReader,
  dealSettled,
  deckButton,
  deckCards,
  deckSlots,
  deckTabs,
  expectNoScroll,
  expectPartsOnScreen,
  label,
  laidOutCardWidth,
  openDeckSelect,
  storeUser,
  type Size,
  type StoredUser,
} from './helpers';

/**
 * Deck selection: the screen between the Battle page and a match.
 *
 * What is checked here is what only a browser can settle — the fit, what is
 * on screen, what a click and the keyboard do, and what survives a reload.
 * Eligibility, the default, and the deal are Vitest's.
 */

/** The viewport ladder, as the Decks page is fitted against. 1100 is too narrow for nine at 120. */
const LADDER: Size[] = [
  { width: 1920, height: 1080 },
  { width: 1600, height: 900 },
  { width: 1440, height: 900 },
  { width: 1366, height: 768 },
  { width: 1100, height: 620 },
];

const DEFAULT: Size = { width: 1440, height: 900 };

const goam = { set: 'FC', number: 6 }; // four stars

/**
 * Four decks: an Incomplete Deck 1, a Ready Deck 2 (the starters), a Ready
 * Deck 3 (the starters reversed), and an Invalid Deck 4 (three Goams).
 */
const MIXED_USER: StoredUser = {
  collection: [...STARTER_REFS.map((ref) => ({ ...ref, quantity: 1 })), { ...goam, quantity: 3 }],
  decks: [
    STARTER_REFS.slice(0, 8),
    [...STARTER_REFS],
    [...STARTER_REFS].reverse(),
    [goam, goam, goam, ...STARTER_REFS.slice(0, 6)],
  ],
};

function beginBattle(page: Page): Locator {
  return page.getByRole('button', { name: 'Begin Battle' });
}

/** The names of the cards a set of holders render, in document order. */
function cardNames(cards: Locator): Promise<string[]> {
  return cards.evaluateAll((els) =>
    els.map((el) => el.querySelector('.cf-name-text')!.textContent!.trim()),
  );
}

/** Waits out the positions' staggered entrance, so a measurement reads them at rest. */
async function settled(page: Page): Promise<void> {
  await expect
    .poll(() =>
      deckSlots(page).evaluateAll((els) => els.every((el) => getComputedStyle(el).opacity === '1')),
    )
    .toBe(true);
}

async function openAs(page: Page, user: StoredUser): Promise<void> {
  await storeUser(page, user);
  await openDeckSelect(page);
}

test.describe('the deck selection screen', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(DEFAULT);
  });

  for (const size of LADDER) {
    test(`at ${label(size)} it fits without scrolling`, async ({ page }) => {
      await page.setViewportSize(size);
      await openAs(page, READY_STARTER_USER);
      await settled(page);

      await expectNoScroll(page);
      await expectPartsOnScreen(page, size, {
        header: page.locator('app-deck-select .screen-header'),
        deckButtons: deckTabs(page),
        positions: deckSlots(page),
        begin: beginBattle(page),
      });

      // The title holds a single line.
      const title = page.locator('app-deck-select .screen-header-title');
      const lines = await title.evaluate((el) => {
        const lineHeight = parseFloat(getComputedStyle(el).lineHeight);
        return Math.round(el.getBoundingClientRect().height / lineHeight);
      });
      expect(lines).toBe(1);

      // Scaled as a whole rather than any card being laid out below the minimum.
      await expect(deckCards(page)).toHaveCount(DECK_SIZE);
      for (let i = 0; i < DECK_SIZE; i++) {
        expect(await laidOutCardWidth(deckSlots(page).nth(i))).toBeGreaterThanOrEqual(
          CARD_MIN_WIDTH,
        );
      }

      await page.screenshot({ path: `test-results/deck-select-${label(size)}.png` });
    });
  }

  test('an Incomplete and an Invalid deck are disabled, say why, and are not chosen', async ({
    page,
  }) => {
    await openAs(page, MIXED_USER);
    const incomplete = deckButton(page, 'Deck 1');
    const invalid = deckButton(page, 'Deck 4');

    await expect(incomplete).toHaveAttribute('aria-disabled', 'true');
    await expect(incomplete).toHaveAttribute('data-tip', 'Incomplete');
    await expect(incomplete).toHaveAccessibleDescription('Incomplete');
    await expect(invalid).toHaveAttribute('aria-disabled', 'true');
    await expect(invalid).toHaveAccessibleDescription('Invalid');

    // Still reachable by keyboard, and its tooltip shows on focus.
    await incomplete.focus();
    await expect(incomplete).toBeFocused();
    await expect
      .poll(() => incomplete.evaluate((el) => getComputedStyle(el, '::after').opacity))
      .toBe('1');

    await incomplete.click({ force: true });
    await invalid.click({ force: true });
    await page.keyboard.press('Enter');
    await expect(deckButton(page, 'Deck 2')).toHaveAttribute('aria-pressed', 'true');
    await expect(incomplete).toHaveAttribute('aria-pressed', 'false');
    await expect(invalid).toHaveAttribute('aria-pressed', 'false');
  });

  test('the buttons match the Decks page: full name when chosen, numeral otherwise', async ({
    page,
  }) => {
    await openAs(page, MIXED_USER);
    await expect(deckTabs(page)).toHaveText(['1', 'Deck 2', '3', '4']);
    for (const name of ['Deck 1', 'Deck 2', 'Deck 3', 'Deck 4']) {
      await expect(deckButton(page, name)).toHaveCount(1);
    }
  });

  test('opens on the first Ready deck, then on the deck last chosen, after a reload', async ({
    page,
  }) => {
    await openAs(page, MIXED_USER);
    await expect(deckButton(page, 'Deck 2')).toHaveAttribute('aria-pressed', 'true');

    await deckButton(page, 'Deck 3').click();
    await expect(deckButton(page, 'Deck 3')).toHaveAttribute('aria-pressed', 'true');
    const reversed = await cardNames(deckCards(page));
    expect(reversed).toHaveLength(DECK_SIZE);

    await page.reload();
    await expect(deckButton(page, 'Deck 3')).toHaveAttribute('aria-pressed', 'true');
    expect(await cardNames(deckCards(page))).toEqual(reversed);
  });

  test('offers no control that changes a deck', async ({ page }) => {
    await openAs(page, MIXED_USER);
    await expect(deckCards(page)).toHaveCount(DECK_SIZE);
    for (const name of [/^Add\b/, /^Remove\b/, 'New deck', /^Delete\b/]) {
      await expect(page.getByRole('button', { name })).toHaveCount(0);
    }
    await expect(page.locator('app-deck-bar .deck-controls')).toHaveCount(0);
  });

  test('reading a card offers Close only, and the deck does not move', async ({ page }) => {
    await openAs(page, READY_STARTER_USER);
    await settled(page);
    const boxes = () =>
      deckCards(page).evaluateAll((els) =>
        els.map((el) => {
          const { left, top, width, height } = el.getBoundingClientRect();
          return { left, top, width, height };
        }),
      );
    const before = await boxes();

    const third = deckSlots(page).nth(2);
    await cardButton(third).click();
    const reader = cardReader(page);
    await expect(reader).toBeVisible();
    await expect(reader.getByRole('button')).toHaveText(['Close']);
    await page.screenshot({ path: 'test-results/deck-select-reading.png' });

    await reader.getByRole('button', { name: 'Close' }).click();
    await expect(reader).toHaveCount(0);
    await expect(cardButton(third)).toBeFocused();
    expect(await boxes()).toEqual(before);
  });

  test('a new player sees the empty state, a way to the Decks page, and no battle', async ({
    page,
  }) => {
    // A fresh context: the app seeds a new player.
    await openDeckSelect(page);
    await expect(page.locator('app-deck-bar .empty-state')).toContainText(
      'None of your decks is ready for battle.',
    );
    await expect(deckButton(page, 'Deck 1')).toHaveAccessibleDescription('Incomplete');

    const begin = beginBattle(page);
    await expect(begin).toHaveAttribute('aria-disabled', 'true');
    await expect(begin).toHaveAccessibleDescription('Choose a ready deck to battle');
    await begin.click({ force: true });
    await expect(page).toHaveURL(/\/battle\/deck$/);
    await page.screenshot({ path: 'test-results/deck-select-empty.png' });

    await page.getByRole('link', { name: 'Build a deck' }).click();
    await expect(page).toHaveURL(/\/decks$/);
  });

  test('Begin Battle reaches the match with the deck in order, and Battle stays current', async ({
    page,
  }) => {
    await openAs(page, MIXED_USER);
    const nav = page.getByRole('navigation', { name: 'Primary' });
    await expect(nav.getByRole('link', { name: 'Battle' })).toHaveAttribute('aria-current', 'page');

    await deckButton(page, 'Deck 3').click();
    const shown = await cardNames(deckCards(page));

    await beginBattle(page).click();
    await expect(page).toHaveURL(/\/game$/);
    await expect(arena(page)).toBeVisible();
    await dealSettled(page);
    expect(await cardNames(page.locator('app-game .rack-player .slot app-card'))).toEqual(shown);
  });

  test('Start Game leads here, and back returns to Battle', async ({ page }) => {
    await storeUser(page, READY_STARTER_USER);
    await page.goto('/battle');
    await page.getByRole('button', { name: 'Start Game' }).click();
    await expect(page).toHaveURL(/\/battle\/deck$/);
    await page.goBack();
    await expect(page).toHaveURL(/\/battle$/);
    await expect(page.getByRole('button', { name: 'Start Game' })).toBeVisible();
  });

  test('a battle can be begun by keyboard alone', async ({ page }) => {
    await openAs(page, MIXED_USER);
    await expect(deckButton(page, 'Deck 2')).toHaveAttribute('aria-pressed', 'true');

    // Tab from the top of the page to Deck 3, and choose it.
    await page.locator('body').focus();
    const deck3 = deckButton(page, 'Deck 3');
    for (let i = 0; i < 40 && !(await deck3.evaluate((el) => el === document.activeElement)); i++) {
      await page.keyboard.press('Tab');
    }
    await expect(deck3).toBeFocused();
    const outline = await deck3.evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(outline).not.toBe('none');
    await page.keyboard.press('Enter');
    await expect(deck3).toHaveAttribute('aria-pressed', 'true');
    const shown = await cardNames(deckCards(page));

    // On to Begin Battle.
    const begin = beginBattle(page);
    for (let i = 0; i < 40 && !(await begin.evaluate((el) => el === document.activeElement)); i++) {
      await page.keyboard.press('Tab');
    }
    await expect(begin).toBeFocused();
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(/\/game$/);
    await dealSettled(page);
    expect(await cardNames(page.locator('app-game .rack-player .slot app-card'))).toEqual(shown);
  });
});
