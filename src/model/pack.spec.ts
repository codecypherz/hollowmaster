import { Card, CARD_DB } from './card';
import {
  PACKS,
  PACK_SIZE,
  PackDefinition,
  RARITIES,
  Rarity,
  chanceOfAtLeast,
  drawPack,
  expectedRarity,
  revealOrder,
  totalWeight,
} from './pack';

const [LEVEL_1, LEVEL_2, LEVEL_3] = PACKS;

/** A card stated only in the property these tests care about: its rarity. */
function rarityCard(stars: Rarity, number: number, name = `Stand-in ${number}`): Card {
  return new Card({
    name,
    arrows: ['N'],
    stars,
    image: 'crawlid.webp',
    attack: 10,
    defense: 10,
    ability: 'A card that exists to have a rarity.',
    set: 'TEST',
    number,
  });
}

/**
 * A small linear congruential generator. Deterministic and cheap, so a
 * distribution can be measured over a large sample without the result moving
 * between runs.
 */
function lcg(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

/** An rng that hands back a written-down sequence, cycling when it runs out. */
function scripted(values: readonly number[]): () => number {
  let i = 0;
  return () => values[i++ % values.length];
}

const rarityOf = (cards: readonly Card[]) => cards.map((c) => c.stars);

// ─── 5.1 The table ──────────────────────────────────────────────────────────

describe('the pack catalogue', () => {
  it('offers exactly three tiers, named Level 1, 2, and 3', () => {
    expect(PACKS).toHaveLength(3);
    expect(PACKS.map((p) => p.name)).toEqual(['Level 1', 'Level 2', 'Level 3']);
    expect(PACKS.map((p) => p.id)).toEqual(['level-1', 'level-2', 'level-3']);
  });

  it('prices every tier as a whole number of Geo, strictly ascending', () => {
    expect(PACKS.map((p) => p.price)).toEqual([100, 250, 500]);
    for (const p of PACKS) {
      expect(Number.isInteger(p.price)).toBe(true);
      expect(p.price).toBeGreaterThan(0);
    }
    expect(LEVEL_1.price).toBeLessThan(LEVEL_2.price);
    expect(LEVEL_2.price).toBeLessThan(LEVEL_3.price);
  });

  it('states a positive weight for all six rarities in every tier', () => {
    for (const p of PACKS) {
      expect(Object.keys(p.weights).map(Number).sort()).toEqual([...RARITIES]);
      for (const r of RARITIES) {
        expect(p.weights[r], `${p.name} weights rarity ${r}`).toBeGreaterThan(0);
      }
    }
  });

  it('spans exactly the six star ratings', () => {
    expect(RARITIES).toEqual([1, 2, 3, 4, 5, 6]);
  });
});

// ─── 5.2 The ladder ─────────────────────────────────────────────────────────

describe('the ladder across the tiers', () => {
  // Every measure below is computed from PACKS, so a tuning edit that breaks
  // the ladder fails here rather than shipping.

  it('raises the expected rarity of a drawn card with every tier', () => {
    const expected = PACKS.map(expectedRarity);
    expect(expected[0]).toBeLessThan(expected[1]);
    expect(expected[1]).toBeLessThan(expected[2]);
    expect(expected.map((e) => Number(e.toFixed(2)))).toEqual([1.67, 2.44, 3.56]);
  });

  it('raises the chance of a four-star-or-better card with every tier', () => {
    const chance = PACKS.map((p) => chanceOfAtLeast(p, 4));
    expect(chance[0]).toBeLessThan(chance[1]);
    expect(chance[1]).toBeLessThan(chance[2]);
    expect(chance.map((c) => Math.round(c * 100))).toEqual([4, 21, 53]);
  });

  it('lowers the chance of a one-star card with every tier', () => {
    const chance = PACKS.map((p) => p.weights[1] / totalWeight(p));
    expect(chance[0]).toBeGreaterThan(chance[1]);
    expect(chance[1]).toBeGreaterThan(chance[2]);
  });

  it('moves no rarity in both directions across the three tiers', () => {
    for (const r of RARITIES) {
      const [a, b, c] = PACKS.map((p) => p.weights[r] / totalWeight(p));
      const nonIncreasing = a >= b && b >= c;
      const nonDecreasing = a <= b && b <= c;
      expect(nonIncreasing || nonDecreasing, `rarity ${r} is monotone across the tiers`).toBe(true);
    }
  });
});

// ─── 5.3 The draw ───────────────────────────────────────────────────────────

describe('drawPack', () => {
  it('yields exactly five cards from every tier', () => {
    for (const p of PACKS) {
      expect(drawPack(p, CARD_DB, lcg(1))).toHaveLength(PACK_SIZE);
    }
  });

  it('fills a pack from a catalogue holding a single card', () => {
    const only = rarityCard(3, 1);
    const pack = drawPack(LEVEL_2, [only], lcg(9));
    expect(pack).toHaveLength(PACK_SIZE);
    expect(pack.every((c) => c === only)).toBe(true);
  });

  it('yields the same pack from the same sequence of random values', () => {
    const values = [0.01, 0.42, 0.73, 0.19, 0.88, 0.5, 0.04, 0.97, 0.31, 0.66];
    for (const p of PACKS) {
      const first = drawPack(p, CARD_DB, scripted(values));
      const second = drawPack(p, CARD_DB, scripted(values));
      expect(first).toEqual(second);
      expect(first.map((c) => c.name)).toEqual(second.map((c) => c.name));
    }
  });

  it('can draw a six-star card from the cheapest pack, given enough packs', () => {
    // Every weight is positive, so no rarity is out of reach from any tier —
    // the tiers differ in how likely a rarity is, never in which are reachable.
    const catalogue = [rarityCard(1, 1), rarityCard(6, 2, 'The Radiance')];
    const rng = lcg(31);
    let drawn = 0;
    for (let i = 0; i < 2_000 && drawn === 0; i++) {
      drawn = drawPack(LEVEL_1, catalogue, rng).filter((c) => c.stars === 6).length;
    }
    expect(drawn).toBeGreaterThan(0);
  });

  it('follows the declared weights and nothing else when a tier is retuned', () => {
    // Retuning a tier is editing its weight table. Nothing in the draw, the
    // price, or the presentation has to be edited to match: a definition whose
    // weights say only six-star cards draws only six-star cards.
    const retuned: PackDefinition = {
      ...LEVEL_1,
      weights: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 10_000_000 },
    };
    const catalogue = RARITIES.map((r) => rarityCard(r, r));
    const pack = drawPack(retuned, catalogue, lcg(41));
    expect(rarityOf(pack)).toEqual([6, 6, 6, 6, 6]);

    // And the shipped table is untouched by having built one.
    expect(LEVEL_1.weights).toEqual({ 1: 55, 2: 30, 3: 11, 4: 2, 5: 1, 6: 1 });
  });

  it('reads only the star rating to decide a card is rare', () => {
    // Two catalogues identical in rarity and different in everything else draw
    // the same rarities from the same randomness.
    const plain = [rarityCard(1, 1), rarityCard(4, 2)];
    const lavish = [
      new Card({ ...plainOptions, name: 'Gilded', stars: 1, attack: 99, defense: 99, number: 1 }),
      new Card({ ...plainOptions, name: 'Storied', stars: 4, attack: 1, defense: 1, number: 2 }),
    ];
    const values = [0.02, 0.3, 0.99, 0.1, 0.5, 0.7, 0.44, 0.6, 0.8, 0.2];
    expect(rarityOf(drawPack(LEVEL_3, plain, scripted(values)))).toEqual(
      rarityOf(drawPack(LEVEL_3, lavish, scripted(values))),
    );
  });

  const plainOptions = {
    arrows: ['N' as const],
    image: 'crawlid.webp',
    ability: 'A card that exists to have a rarity.',
    set: 'TEST',
  };
});

// ─── 5.4 Renormalization ────────────────────────────────────────────────────

describe('renormalization', () => {
  /** The effective distribution tabled in design.md, as percentages. */
  const EFFECTIVE: Record<string, Record<number, number>> = {
    'Level 1': { 1: 56.1, 2: 30.6, 3: 11.2, 4: 2.0 },
    'Level 2': { 1: 32.6, 2: 30.4, 3: 22.8, 4: 14.1 },
    'Level 3': { 1: 13.9, 2: 20.8, 3: 30.6, 4: 34.7 },
  };

  it('never draws a rarity the catalogue cannot supply, and keeps the rest in proportion', () => {
    expect(CARD_DB.some((c) => c.stars >= 5)).toBe(false);

    for (const p of PACKS) {
      const rng = lcg(20260912);
      const counts = new Map<number, number>();
      const packs = 20_000;
      for (let i = 0; i < packs; i++) {
        for (const card of drawPack(p, CARD_DB, rng)) {
          expect(card.stars).toBeLessThanOrEqual(4);
          counts.set(card.stars, (counts.get(card.stars) ?? 0) + 1);
        }
      }

      const drawn = packs * PACK_SIZE;
      for (const [rarity, expected] of Object.entries(EFFECTIVE[p.name])) {
        const observed = ((counts.get(Number(rarity)) ?? 0) / drawn) * 100;
        expect(observed, `${p.name} ★${rarity} observed ${observed.toFixed(2)}%`).toBeCloseTo(
          expected,
          0,
        );
      }
    }
  });

  it('fills a pack with one-star cards from an all-one-star catalogue', () => {
    const commons = [rarityCard(1, 1), rarityCard(1, 2), rarityCard(1, 3)];
    for (const p of PACKS) {
      const pack = drawPack(p, commons, lcg(7));
      expect(pack).toHaveLength(PACK_SIZE);
      expect(rarityOf(pack)).toEqual([1, 1, 1, 1, 1]);
    }
  });

  it('leaves the declared table untouched for the next draw', () => {
    const before = PACKS.map((p) => ({ ...p.weights }));
    for (const p of PACKS) drawPack(p, CARD_DB, lcg(3));
    expect(PACKS.map((p) => ({ ...p.weights }))).toEqual(before);
    expect(PACKS.map(totalWeight)).toEqual([100, 100, 100]);
  });
});

// ─── 5.5 Independence ───────────────────────────────────────────────────────

describe('the five draws', () => {
  const SAMPLE = 5_000;

  it('produce packs holding the same card twice', () => {
    const rng = lcg(11);
    let repeats = 0;
    for (let i = 0; i < SAMPLE; i++) {
      const pack = drawPack(LEVEL_1, CARD_DB, rng);
      if (new Set(pack).size < PACK_SIZE) repeats++;
    }
    expect(repeats).toBeGreaterThan(0);
  });

  it('produce Level 1 packs of five identical rarities', () => {
    const rng = lcg(13);
    let uniform = 0;
    for (let i = 0; i < SAMPLE; i++) {
      if (new Set(rarityOf(drawPack(LEVEL_1, CARD_DB, rng))).size === 1) uniform++;
    }
    expect(uniform).toBeGreaterThan(0);
  });

  it('draw the fifth card from the same distribution as the first', () => {
    const rng = lcg(17);
    const first = new Map<number, number>();
    const fifth = new Map<number, number>();
    const packs = 20_000;
    for (let i = 0; i < packs; i++) {
      const pack = drawPack(LEVEL_2, CARD_DB, rng);
      first.set(pack[0].stars, (first.get(pack[0].stars) ?? 0) + 1);
      fifth.set(pack[4].stars, (fifth.get(pack[4].stars) ?? 0) + 1);
    }
    for (const rarity of [1, 2, 3, 4]) {
      const a = ((first.get(rarity) ?? 0) / packs) * 100;
      const b = ((fifth.get(rarity) ?? 0) / packs) * 100;
      expect(
        Math.abs(a - b),
        `★${rarity}: first ${a.toFixed(2)}% vs fifth ${b.toFixed(2)}%`,
      ).toBeLessThan(2);
    }
  });

  it('pick each card of a rarity about equally often', () => {
    const twoStars = CARD_DB.filter((c) => c.stars === 2);
    expect(twoStars.length).toBeGreaterThan(1);

    const rng = lcg(23);
    const counts = new Map<string, number>();
    let total = 0;
    for (let i = 0; i < 20_000; i++) {
      for (const card of drawPack(LEVEL_2, CARD_DB, rng)) {
        if (card.stars !== 2) continue;
        counts.set(card.name, (counts.get(card.name) ?? 0) + 1);
        total++;
      }
    }
    const share = 1 / twoStars.length;
    for (const card of twoStars) {
      expect((counts.get(card.name) ?? 0) / total, `${card.name}'s share`).toBeCloseTo(share, 1);
    }
  });
});

// ─── 5.6 Reveal order ───────────────────────────────────────────────────────

describe('revealOrder', () => {
  it('orders a pack from most common to most rare', () => {
    const pack = [
      rarityCard(3, 1),
      rarityCard(1, 2),
      rarityCard(4, 3),
      rarityCard(1, 4),
      rarityCard(2, 5),
    ];
    expect(rarityOf(revealOrder(pack))).toEqual([1, 1, 2, 3, 4]);
  });

  it('keeps the draw order of two cards of the same rarity', () => {
    const early = rarityCard(2, 1, 'Drawn first');
    const late = rarityCard(2, 2, 'Drawn second');
    const ordered = revealOrder([rarityCard(4, 3), early, rarityCard(1, 4), late]);
    expect(ordered.map((c) => c.name)).toEqual([
      'Stand-in 4',
      'Drawn first',
      'Drawn second',
      'Stand-in 3',
    ]);
  });

  it('returns an all-one-rarity pack in the order it was drawn', () => {
    const pack = [1, 2, 3, 4, 5].map((n) => rarityCard(1, n));
    expect(revealOrder(pack)).toEqual(pack);
  });

  it('does not disturb the pack it was given', () => {
    const pack = [rarityCard(4, 1), rarityCard(1, 2)];
    const snapshot = [...pack];
    revealOrder(pack);
    expect(pack).toEqual(snapshot);
  });

  it('grants exactly the cards it was handed, whatever the order', () => {
    const pack = drawPack(LEVEL_3, CARD_DB, lcg(5));
    const revealed = revealOrder(pack);
    expect(revealed).toHaveLength(PACK_SIZE);
    expect([...revealed].sort((a, b) => a.number - b.number)).toEqual(
      [...pack].sort((a, b) => a.number - b.number),
    );
  });
});
