import { createParticleField, particleVars, type Particle } from './particle';

/**
 * The field is generated rather than authored, so its character — no grid, no
 * repeat, coherent depth, populated on arrival — is asserted here rather than
 * re-checked by eye on every screen.
 */
describe('createParticleField', () => {
  const COUNT = 22;
  const field = createParticleField(COUNT, 0x5eed);

  it('produces the requested number of particles', () => {
    expect(field).toHaveLength(COUNT);
    expect(createParticleField(7, 1)).toHaveLength(7);
  });

  describe('reproducibility', () => {
    it('yields an identical field for the same seed', () => {
      expect(createParticleField(COUNT, 0x5eed)).toEqual(field);
    });

    it('yields a different field for a different seed', () => {
      expect(createParticleField(COUNT, 0x5eee)).not.toEqual(field);
    });
  });

  describe('placement', () => {
    it('keeps every particle inside the surface on both axes', () => {
      for (const p of field) {
        expect(p.x).toBeGreaterThanOrEqual(0);
        expect(p.x).toBeLessThanOrEqual(100);
        expect(p.y).toBeGreaterThanOrEqual(0);
        expect(p.y).toBeLessThanOrEqual(100);
      }
    });

    it('leaves no gap wider than twice the mean spacing', () => {
      const xs = field.map((p) => p.x).sort((a, b) => a - b);
      const widest = Math.max(...xs.slice(1).map((x, i) => x - xs[i]));
      expect(widest).toBeLessThanOrEqual((100 / COUNT) * 2);
    });

    it('spaces particles irregularly rather than on a grid', () => {
      const xs = field.map((p) => p.x).sort((a, b) => a - b);
      const gaps = xs.slice(1).map((x, i) => x - xs[i]);
      expect(new Set(gaps.map((g) => g.toFixed(2))).size).toBeGreaterThan(gaps.length / 2);
    });

    it('does not correlate the two axes', () => {
      // Stratifying both axes against the same index would lay the resting
      // field out along a diagonal.
      expect(
        Math.abs(
          correlation(
            field.map((p) => p.x),
            field.map((p) => p.y),
          ),
        ),
      ).toBeLessThan(0.5);
    });
  });

  describe('depth coherence', () => {
    const byDepth = [...field].sort((a, b) => a.depth - b.depth);

    it('grows and brightens toward the near end', () => {
      expect(
        monotonic(
          byDepth.map((p) => p.size),
          'up',
        ),
      ).toBe(true);
      expect(
        monotonic(
          byDepth.map((p) => p.alpha),
          'up',
        ),
      ).toBe(true);
    });

    it('sharpens and quickens toward the near end', () => {
      expect(
        monotonic(
          byDepth.map((p) => p.blur),
          'down',
        ),
      ).toBe(true);
      expect(
        monotonic(
          byDepth.map((p) => p.rise),
          'down',
        ),
      ).toBe(true);
    });

    it('spans a real range of depths', () => {
      const depths = field.map((p) => p.depth);
      expect(Math.min(...depths)).toBeLessThan(0.25);
      expect(Math.max(...depths)).toBeGreaterThan(0.6);
    });
  });

  describe('motion', () => {
    it('starts every particle mid-flight so the field is full on arrival', () => {
      for (const p of field) {
        expect(p.offset).toBeLessThan(0);
        expect(Math.abs(p.offset)).toBeLessThan(p.rise);
      }
    });

    it('decorrelates sway from rise so no path repeats', () => {
      for (const p of field) {
        expect(p.swayDur).toBeGreaterThan(0);
        expect(p.rise % p.swayDur).not.toBe(0);
        expect(p.swayDelay).toBeLessThanOrEqual(0);
        expect(Math.abs(p.swayDelay)).toBeLessThanOrEqual(p.swayDur);
      }
    });

    it('keeps falling dust a minority', () => {
      const falling = field.filter((p) => p.falling);
      expect(falling.length).toBeGreaterThan(0);
      expect(falling.length).toBeLessThan(field.length / 2);
    });

    it('keeps falling dust in the far half, where background reads', () => {
      for (const p of field.filter((q) => q.falling)) expect(p.depth).toBeLessThanOrEqual(0.5);
    });
  });
});

describe('particleVars', () => {
  const [p] = createParticleField(1, 42);

  it('emits every property the primitive reads, with units', () => {
    const vars = particleVars(p);
    expect(Object.keys(vars).sort()).toEqual(
      [
        '--alpha',
        '--blur',
        '--offset',
        '--rise',
        '--size',
        '--sway',
        '--sway-delay',
        '--sway-dur',
        '--twinkle-dur',
        '--x',
        '--y',
      ].sort(),
    );
    expect(vars['--x']).toMatch(/%$/);
    expect(vars['--size']).toMatch(/px$/);
    expect(vars['--rise']).toMatch(/s$/);
    expect(vars['--alpha']).toMatch(/^[\d.]+$/);
  });
});

function monotonic(values: number[], dir: 'up' | 'down'): boolean {
  return values.every(
    (v, i) => i === 0 || (dir === 'up' ? v >= values[i - 1] : v <= values[i - 1]),
  );
}

function correlation(a: number[], b: number[]): number {
  const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
  const [ma, mb] = [mean(a), mean(b)];
  const cov = a.reduce((s, x, i) => s + (x - ma) * (b[i] - mb), 0);
  const sd = (xs: number[], m: number) => Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0));
  return cov / (sd(a, ma) * sd(b, mb));
}

export type { Particle };
