import { expect, test, type Page } from '@playwright/test';
import {
  GAME_LADDER,
  choosableCells,
  clashLayer,
  columns,
  label,
  playUntil,
  seedRandom,
  startMatch,
  type Size,
} from './helpers';

/**
 * Seeds whose matches reach the moment under test well before the end, played
 * the way `playUntil` plays; see `seedRandom`. The match is seeded so the
 * moment is fixed, not left to the dice. Seed 2 fights its first combat by the
 * third card down; seed 94 offers a choice of combats at the fourteenth, which
 * is rare with the starter deck's few chevrons. A seed whose combat came with
 * the last card would put the result dialog over the screen being checked.
 */
const CLASH_SEED = 2;
const CHOICE_SEED = 94;

type Boxes = Record<string, { x: number; y: number; width: number; height: number }>;

/** Every arena column's box. */
async function columnBoxes(page: Page): Promise<Boxes> {
  const out: Boxes = {};
  for (const [name, locator] of Object.entries(columns(page))) {
    const box = await locator.boundingBox();
    expect(box, `${name} has a box`).not.toBeNull();
    out[name] = box!;
  }
  return out;
}

/**
 * The column boxes once the arena has refitted to a new viewport: measured
 * until two readings in a row agree, since the refit lands a frame or so after
 * the resize.
 */
async function settledBoxes(page: Page): Promise<Boxes> {
  let last = '';
  let boxes: Boxes = {};
  await expect
    .poll(async () => {
      boxes = await columnBoxes(page);
      const now = JSON.stringify(boxes);
      const same = now === last;
      last = now;
      return same;
    })
    .toBe(true);
  return boxes;
}

/** The same boxes, to within the half-pixel a fractional layout rounds to. */
function expectSameBoxes(actual: Boxes, expected: Boxes, size: Size): void {
  for (const [name, box] of Object.entries(expected)) {
    for (const key of ['x', 'y', 'width', 'height'] as const) {
      expect(
        Math.abs(actual[name][key] - box[key]),
        `${name} ${key} at ${label(size)}`,
      ).toBeLessThan(0.5);
    }
  }
}

/** The codex and its Retreat control are on screen and not covered. */
async function expectCodexClear(page: Page): Promise<void> {
  await expect(columns(page).codex).toBeVisible();
  const retreat = page.getByRole('button', { name: 'Retreat' });
  await expect(retreat).toBeVisible();
  // Nothing is drawn over the Retreat control: it is what the point hits.
  const hit = await retreat.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return el.contains(document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2));
  });
  expect(hit).toBe(true);
}

test.describe('combat on screen leaves the arena where it was', () => {
  for (const size of GAME_LADDER) {
    test(`at ${label(size)} a clash moves and resizes no column`, async ({ page }) => {
      test.setTimeout(90_000);
      await page.setViewportSize(size);
      await seedRandom(page, CLASH_SEED);
      await startMatch(page);
      const before = await columnBoxes(page);

      await playUntil(page, 'clash');
      const during = await columnBoxes(page);

      expectSameBoxes(during, before, size);
      await expectCodexClear(page);

      // The clash sits inside the board and never takes a pointer.
      const board = during['board'];
      const clash = (await clashLayer(page).boundingBox())!;
      expect(clash.x).toBeGreaterThanOrEqual(board.x - 0.5);
      expect(clash.x + clash.width).toBeLessThanOrEqual(board.x + board.width + 0.5);
      expect(await clashLayer(page).evaluate((el) => getComputedStyle(el).pointerEvents)).toBe(
        'none',
      );
    });
  }

  test('the choosable marking moves and resizes no column at any size', async ({ page }) => {
    test.setTimeout(90_000);
    await seedRandom(page, CHOICE_SEED);
    await page.setViewportSize(GAME_LADDER[0]);
    await startMatch(page);

    // The layout at every size before anything is marked...
    const unmarked = new Map<Size, Boxes>();
    for (const size of GAME_LADDER) {
      await page.setViewportSize(size);
      unmarked.set(size, await settledBoxes(page));
    }

    // ...and again while a choice is waiting, which holds until it is made.
    await playUntil(page, 'choice');
    expect(await choosableCells(page).count()).toBeGreaterThanOrEqual(2);
    for (const size of GAME_LADDER) {
      await page.setViewportSize(size);
      expectSameBoxes(await settledBoxes(page), unmarked.get(size)!, size);
      await expectCodexClear(page);
    }

    // And a marked target is a real control: clicking it fights that combat.
    await choosableCells(page).first().click();
    await expect(clashLayer(page)).toBeVisible();
  });
});
