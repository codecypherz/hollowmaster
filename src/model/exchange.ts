import { CARD_BY_KEY, Card, CardKey, STARS_MAX, STARS_MIN, cardKey } from './card';
import { trimDecks } from './deck';
import { UserState, quantityOf } from './user';

/** What one copy of a card of some rarity sells for, and what it costs. */
export interface RosaryRate {
  readonly sell: number;
  readonly buy: number;
}

/**
 * The Rosary rate of each rarity.
 *
 * The one statement of every rate: each price the application shows or charges
 * is looked up here.
 */
export const ROSARY_RATES: Readonly<Record<number, RosaryRate>> = Object.freeze({
  1: Object.freeze({ sell: 1, buy: 4 }),
  2: Object.freeze({ sell: 3, buy: 12 }),
  3: Object.freeze({ sell: 9, buy: 27 }),
  4: Object.freeze({ sell: 33, buy: 99 }),
  5: Object.freeze({ sell: 330, buy: 660 }),
  6: Object.freeze({ sell: 5000, buy: 9999 }),
});

/**
 * Checks that every rating a card may have has whole-number rates, and that
 * none sells at or above its purchase price. Run at module load, so a mis-stated
 * table fails at app start rather than in a player's purse.
 */
export function assertRosaryRates(rates: Readonly<Record<number, RosaryRate>>): void {
  for (let stars = STARS_MIN; stars <= STARS_MAX; stars++) {
    const rate = rates[stars];
    if (!rate) throw new Error(`Rarity ${stars} has no Rosary rate`);
    if (![rate.sell, rate.buy].every((price) => Number.isInteger(price) && price > 0)) {
      throw new Error(`Rarity ${stars} must have whole-number Rosary rates`);
    }
    if (rate.sell >= rate.buy) {
      throw new Error(`Rarity ${stars} must sell for less than it costs`);
    }
  }
}

assertRosaryRates(ROSARY_RATES);

/** What selling one copy of `card` credits. */
export function salePrice(card: Card): number {
  return ROSARY_RATES[card.stars].sell;
}

/** What buying one copy of `card` costs. */
export function purchasePrice(card: Card): number {
  return ROSARY_RATES[card.stars].buy;
}

// ─── The rate that has to be earned ─────────────────────────────────────────

/** The rarity whose rate the player does not know from the start. */
export const SECRET_RARITY = 6;

/**
 * The Rosary balance that, once held, makes the secret rate known. A milestone,
 * stated apart from the purchase rate it happens to equal.
 */
export const SECRET_RATE_PEAK = 9999;

/**
 * Whether the player knows the rate of that rarity. The one rule every surface
 * that shows a price asks, and the one `settleOrder` enforces.
 */
export function knowsRate({ milestones }: UserState, stars: number): boolean {
  if (stars < SECRET_RARITY) return true;
  return milestones.rarestHeld >= SECRET_RARITY || milestones.peakRosaries >= SECRET_RATE_PEAK;
}

/** One rarity's rate, as the player may be shown it. */
export interface RarityRate extends RosaryRate {
  readonly stars: number;
}

/** The rates the player knows, lowest rarity first. */
export function rosaryRates(state: UserState): RarityRate[] {
  const known: RarityRate[] = [];
  for (let stars = STARS_MIN; stars <= STARS_MAX; stars++) {
    if (knowsRate(state, stars)) known.push({ stars, ...ROSARY_RATES[stars] });
  }
  return known;
}

/** An amount of Rosaries in words, for assistive technology: `1 Rosary`, `4 Rosaries`. */
export function rosariesText(amount: number): string {
  return `${amount} ${amount === 1 ? 'Rosary' : 'Rosaries'}`;
}

/** Which way a card is being exchanged. */
export type ExchangeAction = 'sell' | 'buy';

/** One card of an order: how many copies of it to sell, or to buy. */
export interface OrderLine {
  readonly key: CardKey;
  readonly action: ExchangeAction;
  /** Whole number of copies, at least one. */
  readonly quantity: number;
}

/** What one copy of `card` is worth in that direction. */
export function unitPrice(card: Card, action: ExchangeAction): number {
  return action === 'sell' ? salePrice(card) : purchasePrice(card);
}

/** What exchanging that many does to the balance: up for a sale, down for a purchase. */
export function rosaryEffect(card: Card, action: ExchangeAction, quantity: number): number {
  const total = unitPrice(card, action) * quantity;
  return action === 'sell' ? total : -total;
}

// Like the operations in `deck.ts`, this is a pure function over the whole
// user and `null` is the refusal: a refused order changes nothing, and one
// that succeeds changes every side in the one returned state, so
// `UserService.apply` commits it as a single step.

/**
 * The user with the whole order settled: every copy sold removed, every copy
 * bought added, the Rosary balance changed by the net, and every deck trimmed
 * to what each sale leaves. Geo is not touched. A card sold to nothing leaves
 * the collection, so it reads as owned zero times.
 *
 * Or `null`, for an order that names a card twice or one the catalogue does
 * not hold, a quantity that is not a whole number of at least one, more sales
 * of a card than copies held, a purchase whose rate the user did not know
 * beforehand, or a net the balance does not cover. Sales and
 * purchases are one sum, so the order of the lines cannot matter and a sale
 * can pay for a purchase listed before it.
 */
export function settleOrder(state: UserState, order: readonly OrderLine[]): UserState | null {
  const collection = new Map(state.collection);
  const seen = new Set<CardKey>();
  let rosaries = state.rosaries;
  let decks = state.decks;

  for (const { key, action, quantity } of order) {
    const card = CARD_BY_KEY.get(key);
    if (!card || seen.has(key)) return null;
    if (!Number.isInteger(quantity) || quantity < 1) return null;
    seen.add(key);

    const held = quantityOf(state.collection, card);
    rosaries += rosaryEffect(card, action, quantity);
    if (action === 'buy') {
      if (!knowsRate(state, card.stars)) return null;
      collection.set(key, held + quantity);
      continue;
    }

    if (quantity > held) return null;
    const left = held - quantity;
    if (left === 0) collection.delete(key);
    else collection.set(key, left);
    decks = trimDecks(decks, key, left);
  }

  if (rosaries < 0) return null;
  return { ...state, rosaries, collection, decks };
}

/**
 * The indices of the decks selling `quantity` copies of `card` would trim, in
 * order. Empty when that sale could not happen: nothing to sell, or more than
 * is held.
 *
 * Asked of the same `trimDecks` settling runs, so a warning built from this
 * cannot disagree with what the sale then does.
 */
export function decksTrimmedBySale(state: UserState, card: Card, quantity: number): number[] {
  const held = quantityOf(state.collection, card);
  if (quantity < 1 || quantity > held) return [];
  const trimmed = trimDecks(state.decks, cardKey(card), held - quantity);
  const indices: number[] = [];
  trimmed.forEach((deck, i) => {
    if (deck !== state.decks[i]) indices.push(i);
  });
  return indices;
}
