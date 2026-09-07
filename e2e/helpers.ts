import { expect, type Locator, type Page } from '@playwright/test';

/** Both hands' nine positions each. */
export const HAND_POSITIONS = 18;

/** The board's 5x5 cells. */
export const BOARD_CELLS = 25;

/**
 * The in-game route is guarded: it may only be reached by starting a match from
 * Battle, never by URL. Most checks here need the in-game screen, so that walk
 * lives in one place.
 *
 * Web-first assertions carry all the waiting — there is no fixed delay or poll
 * anywhere in this suite.
 */
export async function startMatch(page: Page): Promise<void> {
  await page.goto('/battle');
  await page.getByRole('button', { name: 'Start Game' }).click();

  await expect(page).toHaveURL(/\/game$/);
  await expect(arena(page)).toBeVisible();
  await dealSettled(page);
}

/**
 * Waits out the staggered deal, so a check measures — or photographs — the
 * screen at rest rather than part-way through its entrance. The entrance fades
 * each dealt card in — the animation is on the card, not on the position that
 * holds it — so a rack whose cards are all at full opacity has finished
 * arriving.
 */
export async function dealSettled(page: Page): Promise<void> {
  const dealt = page.locator('app-game app-hand-rack .slot app-card');
  await expect(dealt).toHaveCount(HAND_POSITIONS);
  await expect
    .poll(() =>
      dealt.evaluateAll((cards) => cards.every((card) => getComputedStyle(card).opacity === '1')),
    )
    .toBe(true);
}

/** The four-column arena: the element the screen's geometry is written onto. */
export function arena(page: Page): Locator {
  return page.locator('app-game .arena');
}

/** The arena's four columns, in the order the grid lays them out. */
export function columns(page: Page): Record<string, Locator> {
  return {
    codex: page.locator('app-game .codex'),
    playerRack: page.locator('app-game .rack-player'),
    board: page.getByLabel('Game board'),
    opponentRack: page.locator('app-game .rack-opponent'),
  };
}

/** A viewport the in-game screen is checked at. */
export interface Size {
  width: number;
  height: number;
}

/** A viewport's name in a test title or an artifact filename. */
export const label = ({ width, height }: Size) => `${width}x${height}`;

/** The page does not scroll in either axis. */
export async function expectNoScroll(page: Page): Promise<void> {
  await expect
    .poll(() =>
      page.evaluate(() => {
        const d = document.documentElement;
        return {
          overflowX: d.scrollWidth - d.clientWidth,
          overflowY: d.scrollHeight - d.clientHeight,
        };
      }),
    )
    .toEqual({ overflowX: 0, overflowY: 0 });
}

/**
 * Every column of the arena is wholly on screen, and the arena still holds all
 * of its cells and hand positions.
 *
 * A half-pixel of tolerance: bounding boxes are fractional and the arena's
 * viewing scale is quantised, so an exact comparison would fail on rounding
 * rather than on clipping.
 */
export async function expectNothingClipped(page: Page, size: Size): Promise<void> {
  const parts = {
    ...columns(page),
    standing: page.getByLabel('Standing'),
    inspector: page.locator('app-game app-card-inspector'),
  };

  for (const [name, locator] of Object.entries(parts)) {
    const box = await locator.boundingBox();
    expect(box, `${name} has a bounding box at ${label(size)}`).not.toBeNull();
    const { x, y, width, height } = box!;
    expect(x, `${name} left edge at ${label(size)}`).toBeGreaterThanOrEqual(-0.5);
    expect(y, `${name} top edge at ${label(size)}`).toBeGreaterThanOrEqual(-0.5);
    expect(x + width, `${name} right edge at ${label(size)}`).toBeLessThanOrEqual(size.width + 0.5);
    expect(y + height, `${name} bottom edge at ${label(size)}`).toBeLessThanOrEqual(
      size.height + 0.5,
    );
  }

  await expect(page.locator('app-game .board-cell')).toHaveCount(BOARD_CELLS);
  await expect(page.locator('app-game app-hand-rack .slot')).toHaveCount(HAND_POSITIONS);
}
