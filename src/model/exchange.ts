import { CARD_BY_KEY, Card, CardKey, cardKey } from './card';
import { trimDecks } from './deck';
import { UserState, quantityOf } from './user';

/**
 * What a star of rarity is worth in Rosaries, to sell and to buy.
 *
 * The one statement of both multipliers: every price the application shows or
 * charges is derived from here. Selling at a tenth of the purchase price is
 * what keeps a sale below its purchase for every card.
 */
export const ROSARY_PRICE_PER_STAR = Object.freeze({ sell: 10, buy: 100 });

/** What selling one copy of `card` credits. */
export function salePrice(card: Card): number {
  return card.stars * ROSARY_PRICE_PER_STAR.sell;
}

/** What buying one copy of `card` costs. */
export function purchasePrice(card: Card): number {
  return card.stars * ROSARY_PRICE_PER_STAR.buy;
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
 * of a card than copies held, or a net the balance does not cover. Sales and
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
