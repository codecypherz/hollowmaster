import { Card } from './card';

/**
 * A card's rarity is its star rating — the card model's own 1–6 — and nothing
 * else. No separate rarity property exists, and no pack behaviour consults any
 * other property of a card to decide how rare it is.
 */
export type Rarity = 1 | 2 | 3 | 4 | 5 | 6;

/** The six rarities, ascending. */
export const RARITIES: readonly Rarity[] = [1, 2, 3, 4, 5, 6];

/** A weight for every rarity. Higher is likelier; every weight is positive. */
export type RarityWeights = Readonly<Record<Rarity, number>>;

export interface PackDefinition {
  readonly id: 'level-1' | 'level-2' | 'level-3';
  readonly name: string;
  /** Price in Geo. */
  readonly price: number;
  readonly weights: RarityWeights;
}

/** How many cards every pack of every tier yields. */
export const PACK_SIZE = 5;

/**
 * The three tiers.
 *
 * The weights sum to 100 so the table reads as percentages at a glance, but
 * the draw treats them strictly as weights over a running sum and never as
 * percentages — it has to, because dropping an unrepresented rarity breaks the
 * sum, and a table that must total exactly 100 is painful to tune.
 *
 * Every weight is at least 1, which is what makes "every pack can yield every
 * card" true by construction rather than by convention. Each rarity's weight
 * is monotone across the three tiers — ★1 and ★2 fall, ★3 through ★6 rise —
 * with the crossover between ★2 and ★3, so Level 2 is genuinely a middle
 * rather than Level 1 with a longer tail.
 */
export const PACKS: readonly PackDefinition[] = Object.freeze([
  {
    id: 'level-1',
    name: 'Level 1',
    price: 100,
    weights: Object.freeze({ 1: 55, 2: 30, 3: 11, 4: 2, 5: 1, 6: 1 }),
  },
  {
    id: 'level-2',
    name: 'Level 2',
    price: 250,
    weights: Object.freeze({ 1: 30, 2: 28, 3: 21, 4: 13, 5: 5, 6: 3 }),
  },
  {
    id: 'level-3',
    name: 'Level 3',
    price: 500,
    weights: Object.freeze({ 1: 10, 2: 15, 3: 22, 4: 25, 5: 18, 6: 10 }),
  },
] as const);

/**
 * Draws a pack: five cards, each drawn independently.
 *
 * Renormalization is the weighted pick itself rather than a step before it.
 * Only the rarities the catalogue can actually supply contribute to the running
 * sum, and dividing by that sum *is* proportional rescaling — so there is no
 * mutated table, nothing to keep in sync, and the declared weights are the same
 * for the next draw. A draw therefore never fails and never substitutes a card
 * of a rarity that was not asked for.
 *
 * Randomness is a parameter so the odds can be measured to any precision in a
 * unit test: the same tier drawn against the same catalogue with the same
 * sequence of values yields the same five cards.
 */
export function drawPack(
  def: PackDefinition,
  catalogue: readonly Card[],
  rng: () => number = Math.random,
): Card[] {
  if (catalogue.length === 0) throw new Error('cannot draw a pack from an empty catalogue');

  const byRarity = groupByRarity(catalogue);
  const live = RARITIES.filter((r) => (byRarity.get(r)?.length ?? 0) > 0);
  const total = live.reduce((sum, r) => sum + def.weights[r], 0);

  const pack: Card[] = [];
  for (let i = 0; i < PACK_SIZE; i++) {
    const rarity = pickRarity(def, live, total, rng);
    const candidates = byRarity.get(rarity)!;
    pack.push(candidates[Math.floor(rng() * candidates.length) % candidates.length]);
  }
  return pack;
}

/**
 * A pack's five cards in the order they are shown: ascending by rarity, so the
 * most common comes first and the rarest last, and the pack builds toward its
 * best card rather than spoiling it.
 *
 * The sort is stable, so cards of equal rarity keep the order they were drawn
 * in and an all-one-rarity pack is returned exactly as it was drawn.
 */
export function revealOrder(cards: readonly Card[]): Card[] {
  return [...cards].sort((a, b) => a.stars - b.stars);
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function groupByRarity(catalogue: readonly Card[]): Map<Rarity, Card[]> {
  const byRarity = new Map<Rarity, Card[]>();
  for (const card of catalogue) {
    const rarity = card.stars as Rarity;
    const bucket = byRarity.get(rarity);
    if (bucket) bucket.push(card);
    else byRarity.set(rarity, [card]);
  }
  return byRarity;
}

/** Walks the represented rarities, accumulating until the roll falls in a band. */
function pickRarity(
  def: PackDefinition,
  live: readonly Rarity[],
  total: number,
  rng: () => number,
): Rarity {
  let roll = rng() * total;
  for (const rarity of live) {
    roll -= def.weights[rarity];
    if (roll < 0) return rarity;
  }
  // Only reachable if `rng` returns exactly 1, or through floating-point
  // accumulation. The last represented rarity is the band the roll sat in.
  return live[live.length - 1];
}

/**
 * The expected rarity of a card drawn from a tier — its weights read as a
 * distribution. Derived rather than tabled, so tuning the weights moves this
 * with them.
 */
export function expectedRarity(def: PackDefinition): number {
  const total = totalWeight(def);
  return RARITIES.reduce((sum, r) => sum + r * def.weights[r], 0) / total;
}

/** The declared chance of drawing a card of at least `rarity`, as a fraction. */
export function chanceOfAtLeast(def: PackDefinition, rarity: Rarity): number {
  const total = totalWeight(def);
  return RARITIES.filter((r) => r >= rarity).reduce((sum, r) => sum + def.weights[r], 0) / total;
}

export function totalWeight(def: PackDefinition): number {
  return RARITIES.reduce((sum, r) => sum + def.weights[r], 0);
}
