import { expect, test, type Locator } from '@playwright/test';

/**
 * The card renderer's two width constants, from
 * `openspec/specs/design-system/card/spec.md`: the narrowest width the card is
 * ever laid out at, and the width at which the ability section appears. The
 * style guide's size ladder straddles the gate a pixel apart, which is what
 * makes both sides of it observable on one page.
 */
const MIN_WIDTH = 120;
const ABILITY_GATE = 200;

/** The style guide's ladder, narrowest first. */
const LADDER = [MIN_WIDTH, 160, ABILITY_GATE - 1, ABILITY_GATE, 260];

/**
 * How much of the card the ability section occupies.
 *
 * Below the gate the section is not removed — it is held in the DOM at 1px and
 * clipped, so `aria-describedby` keeps resolving — which is why this measures
 * the rendered box rather than asking whether the element exists.
 */
async function abilityWidth(card: Locator): Promise<number> {
  const box = await card.locator('.cf-ability').boundingBox();
  return box?.width ?? 0;
}

test.describe('the card renderer, on the style guide', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/style-guide');
    await expect(page.locator('.scale-row .card-demo')).toHaveCount(LADDER.length);
  });

  test('the ability section is gated on the card’s own rendered width', async ({ page }) => {
    const belowGate = page.locator('.scale-row .card-demo').nth(LADDER.indexOf(ABILITY_GATE - 1));
    const atGate = page.locator('.scale-row .card-demo').nth(LADDER.indexOf(ABILITY_GATE));

    // A pixel below the gate: the section is clipped away, drawn nowhere.
    expect(await abilityWidth(belowGate)).toBeLessThanOrEqual(1);

    // At the gate: the section is drawn, and carries the ability text, the set,
    // and the collector number.
    const shown = await abilityWidth(atGate);
    expect(shown).toBeGreaterThan(ABILITY_GATE / 2);

    await expect(atGate.locator('.cf-ability-text')).toBeVisible();
    await expect(atGate.locator('.cf-ability-text')).not.toBeEmpty();
    await expect(atGate.locator('.cf-set')).toBeVisible();
    await expect(atGate.locator('.cf-set')).not.toBeEmpty();
    await expect(atGate.locator('.cf-number')).toBeVisible();
    // The collector number is zero-padded to three.
    await expect(atGate.locator('.cf-number')).toHaveText(/^\d{3}$/);

    // The same card either side of the gate, so what differs is the width alone.
    await expect(belowGate.locator('.cf-name-text')).toHaveText(
      (await atGate.locator('.cf-name-text').textContent())!,
    );
  });

  test('no card on the page is rendered below the minimum supported width', async ({ page }) => {
    const slots = page.locator('.scale-row .card-slot');
    const widths: number[] = [];
    for (let i = 0; i < LADDER.length; i++) {
      const box = await slots.nth(i).boundingBox();
      expect(box).not.toBeNull();
      widths.push(Math.round(box!.width));
    }

    expect(widths).toEqual(LADDER);
    expect(Math.min(...widths)).toBe(MIN_WIDTH);

    // Nothing anywhere else on the page renders a card narrower either.
    const everyCard = await page
      .locator('app-card .frame')
      .evaluateAll((frames) => frames.map((frame) => frame.getBoundingClientRect().width));
    expect(everyCard.length).toBeGreaterThan(0);
    expect(Math.min(...everyCard)).toBeGreaterThanOrEqual(MIN_WIDTH);
  });

  test('the size ladder is captured for review', async ({ page }) => {
    // A review artifact, not a baseline: the gate is meant to be visible in it
    // by eye, between the 199px and 200px steps.
    await page
      .locator('.scale-row')
      .screenshot({ path: test.info().outputPath('card-size-ladder.png') });
  });
});
