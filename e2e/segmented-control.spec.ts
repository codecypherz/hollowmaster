import { expect, test, type Locator } from '@playwright/test';

/**
 * The segmented control, on the style guide: the claims about its bar that only
 * a rendered page can answer. What it must be is
 * `openspec/specs/design-system/primitives/spec.md`'s to say.
 */

const bar = (section: Locator, accent: string, state: string) =>
  section.locator(`[data-accent="${accent}"] [data-state="${state}"]`);

/** Each segment's box and resolved type, left to right. */
function segments(control: Locator) {
  return control.locator(':scope > button, :scope > input').evaluateAll((els) =>
    els.map((el) => {
      const { left, right, top, width, height } = el.getBoundingClientRect();
      const { fontFamily, fontSize, letterSpacing, borderTopWidth, borderTopColor, zIndex } =
        getComputedStyle(el);
      return {
        box: { left, right, top, width, height },
        metrics: { width, height, fontFamily, fontSize, letterSpacing, borderTopWidth },
        borderColor: borderTopColor,
        zIndex: zIndex === 'auto' ? 0 : Number(zIndex),
      };
    }),
  );
}

test.describe('the segmented control, on the style guide', () => {
  let section: Locator;

  test.beforeEach(async ({ page }) => {
    await page.goto('/style-guide');
    section = page.getByTestId('sg-segmented');
    await section.scrollIntoViewIfNeeded();
  });

  test('its segments share their edges, and the accents differ in colour only', async () => {
    for (const state of [
      'with a field',
      'without a field',
      'segment unavailable',
      'field not editable',
    ]) {
      const gold = await segments(bar(section, 'gold', state));
      const soul = await segments(bar(section, 'soul', state));
      for (const parts of [gold, soul]) {
        parts.forEach((part, i) => {
          if (i > 0) expect(part.box.left).toBeCloseTo(parts[i - 1].box.right - 1, 1);
          expect(part.box.top).toBeCloseTo(parts[0].box.top, 1);
          expect(part.box.height).toBeCloseTo(parts[0].box.height, 1);
          // One outline: an unavailable segment's border is every other's.
          expect(part.borderColor).toBe(parts[0].borderColor);
        });
      }
      expect(gold.map((part) => part.metrics)).toEqual(soul.map((part) => part.metrics));
      expect(gold[0].borderColor).not.toBe(soul[0].borderColor);
    }
  });

  test('a focused segment’s whole outline is above its neighbours', async ({ page }) => {
    for (const accent of ['gold', 'soul']) {
      const control = bar(section, accent, 'with a field');
      const stops = control.locator(':scope > button, :scope > input');
      await stops.first().focus();
      for (let i = 0; i < (await stops.count()); i++) {
        if (i > 0) await page.keyboard.press('Tab');
        const stop = stops.nth(i);
        await expect(stop).toBeFocused();
        const outline = await stop.evaluate((el) => {
          const { outlineStyle, outlineWidth, outlineOffset } = getComputedStyle(el);
          let clipped = false;
          for (let up = el.parentElement; up; up = up.parentElement) {
            if (getComputedStyle(up).overflowX === 'visible') continue;
            const reach = parseFloat(outlineWidth) + parseFloat(outlineOffset);
            const own = el.getBoundingClientRect();
            const bounds = up.getBoundingClientRect();
            clipped ||= own.left - reach < bounds.left || own.right + reach > bounds.right;
          }
          return { outlineStyle, width: parseFloat(outlineWidth), clipped };
        });
        expect(outline).toEqual({ outlineStyle: 'solid', width: 2, clipped: false });
        const layers = (await segments(control)).map((part) => part.zIndex);
        for (const [j, layer] of layers.entries()) {
          if (j !== i) expect(layers[i]).toBeGreaterThan(layer);
        }
      }
    }
  });

  test('a row at the dearest price and a three-digit quantity fits', async () => {
    const row = section.getByTestId('sg-segmented-row').locator('.seg-row');
    const faults = await row.evaluate((el) => {
      const price = el.querySelector('app-rosary')!.getBoundingClientRect();
      const control = el.querySelector('.hk-seg')!.getBoundingClientRect();
      const field = el.querySelector('input')!;
      return {
        priceOverlaps: price.right > control.left,
        fieldOverflows: field.scrollWidth > field.clientWidth,
        rowOverflows: el.scrollWidth > el.clientWidth,
      };
    });
    expect(faults).toEqual({ priceOverlaps: false, fieldOverflows: false, rowOverflows: false });
  });

  test('is captured for review', async () => {
    await section.screenshot({ path: 'test-results/style-guide-segmented.png' });
  });
});
