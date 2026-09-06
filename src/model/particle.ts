/* ─── Soul particle field ─────────────────────────────────────────────────────
   Generates the drifting motes that fill the atmosphere on every full-screen
   surface.

   The field used to be derived from each particle's index: evenly spaced across
   the viewport, rising straight up, varying only by `nth-child`. That reads as a
   mechanism — the column spacing and the repeating size pattern are visible once
   noticed — so the generation moved here, where a particle can vary along every
   axis at once.

   Generation is seeded rather than free-running. The same surface therefore
   produces the same field on every render, which makes the field's properties
   assertable in a unit test instead of only by eye.
   ──────────────────────────────────────────────────────────────────────────── */

/** One mote. Positions are percentages of the surface; times are seconds. */
export interface Particle {
  /** Horizontal position across the surface, 0–100. */
  x: number;
  /** Vertical position, 0–100. Used only in the reduced-motion resting state. */
  y: number;
  /** 0 = far, 1 = near. Drives size, alpha, blur, and rise together. */
  depth: number;
  size: number;
  alpha: number;
  blur: number;
  /** Seconds to cross the surface. Nearer particles cross faster. */
  rise: number;
  /** Negative, so the particle is already mid-flight on the first frame. */
  offset: number;
  /** Lateral drift amplitude in px, and its own independent cycle. */
  sway: number;
  swayDur: number;
  swayDelay: number;
  twinkleDur: number;
  /** A minority drift down as dust rather than rising as soul. */
  falling: boolean;
}

/* Depth ramps. One scalar drives all four so the cues can never contradict:
   a particle that reads as near is never also slow, small, or out of focus. */
const SIZE = [1, 4] as const; // px
const ALPHA = [0.25, 0.95] as const;
const BLUR = [1.2, 0] as const; // px — capped low; each blurred dot is a layer
const RISE = [26, 11] as const; // s — far particles crawl, near ones hurry

/** Biases depth toward the far end, so most motes are small and a few read close. */
const DEPTH_BIAS = 1.6;

/** Share of the field that falls as dust instead of rising as soul. */
const FALLING_SHARE = 0.18;

/**
 * Build a particle field.
 *
 * @param count how many particles — the only parameter a surface chooses.
 * @param seed  fixes the field; distinct per surface, constant per surface.
 */
export function createParticleField(count: number, seed: number): Particle[] {
  const rand = mulberry32(seed);
  const lerp = (r: readonly [number, number], t: number) => r[0] + (r[1] - r[0]) * t;

  /* Stratified rather than uniform: each particle is jittered inside its own
     slice of the width. At these counts pure randomness leaves visible clumps
     and bald patches, while stratification guarantees coverage and still leaves
     no perceptible spacing. */
  const stratify = (i: number) => round(((i + rand()) / count) * 100, 2);

  const particles: Particle[] = [];

  for (let i = 0; i < count; i++) {
    const falling = rand() < FALLING_SHARE;

    /* Dust lives in the far half by construction, which is what makes it read
       as background without needing a second set of ramps to contradict the
       depth cues with. */
    const depth = round(rand() ** DEPTH_BIAS * (falling ? 0.5 : 1), 4);

    const size = round(lerp(SIZE, depth), 2);
    const rise = round(lerp(RISE, depth), 2);

    /* Sway is deliberately unrelated to rise, so a particle's lateral phase
       never lines up with its vertical one and no path visibly repeats. */
    const swayDur = round(4.5 + rand() * 5, 2);

    particles.push({
      x: stratify(i),
      y: 0, // assigned below, decorrelated from x
      depth,
      size,
      alpha: round(lerp(ALPHA, depth), 3),
      blur: round(lerp(BLUR, depth), 2),
      rise,
      /* Negative: every particle starts mid-flight, so the field is already
         full on the first painted frame rather than taking the better part of a
         minute to fill in. */
      offset: round(-rand() * rise, 2),
      sway: round(lerp([10, 44], depth) * (0.7 + rand() * 0.6), 2),
      swayDur,
      swayDelay: round(-rand() * swayDur, 2),
      twinkleDur: round(2.2 + rand() * 3.4, 2),
      falling,
    });
  }

  /* Vertical placement is stratified too, then shuffled onto the particles.
     Stratifying both axes against the same index would lay the resting field
     out along a diagonal; the shuffle keeps the coverage and drops the
     correlation. */
  const ys = shuffle(
    particles.map((_, i) => stratify(i)),
    rand,
  );
  particles.forEach((p, i) => (p.y = ys[i]));

  return particles;
}

/** The CSS custom properties the `.particle` primitive reads, units included. */
export function particleVars(p: Particle): Record<string, string> {
  return {
    '--x': `${p.x}%`,
    '--y': `${p.y}%`,
    '--size': `${p.size}px`,
    '--alpha': `${p.alpha}`,
    '--blur': `${p.blur}px`,
    '--rise': `${p.rise}s`,
    '--offset': `${p.offset}s`,
    '--sway': `${p.sway}px`,
    '--sway-dur': `${p.swayDur}s`,
    '--sway-delay': `${p.swayDelay}s`,
    '--twinkle-dur': `${p.twinkleDur}s`,
  };
}

/**
 * mulberry32 — a small, fast, well-distributed 32-bit PRNG.
 *
 * Seeded generation is the point: `Math.random` would give a field that changed
 * on every render and could only be checked by eye.
 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], rand: () => number): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

function round(n: number, places: number): number {
  const f = 10 ** places;
  return Math.round(n * f) / f;
}
