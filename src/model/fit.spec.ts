import { fitOverlay } from './fit';

describe('fitOverlay', () => {
  /** A representative laid-out surface, of the order the stylesheet produces. */
  const surface = { width: 820, height: 760 };

  it('applies no transform where the viewport hosts the surface', () => {
    for (const [width, height] of [
      [1920, 1080],
      [1440, 900],
      [1366, 768],
    ]) {
      expect(fitOverlay({ width, height }, surface)).toBe(1);
    }
  });

  it('scales the whole overlay uniformly where the viewport cannot host it', () => {
    const scale = fitOverlay({ width: 600, height: 500 }, surface);
    expect(scale).toBeLessThan(1);
    expect(scale).toBeGreaterThan(0);
    // One factor for both axes — the layout itself never changes.
    expect(fitOverlay({ width: 600, height: 500 }, surface)).toBe(scale);
  });

  it('takes the tighter of the two axes', () => {
    expect(fitOverlay({ width: 410, height: 10_000 }, surface)).toBeCloseTo(0.5, 2);
    expect(fitOverlay({ width: 10_000, height: 380 }, surface)).toBeCloseTo(0.5, 2);
  });

  it('never yields a zero or negative factor', () => {
    for (const available of [
      { width: 0, height: 0 },
      { width: -100, height: -100 },
      { width: 1, height: 1 },
    ]) {
      expect(fitOverlay(available, surface)).toBeGreaterThan(0);
    }
  });

  it('applies no transform before the surface has been measured', () => {
    expect(fitOverlay({ width: 1440, height: 900 }, { width: 0, height: 0 })).toBe(1);
  });
});
