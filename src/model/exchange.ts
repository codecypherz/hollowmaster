import { Card, cardKey } from './card';
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

// Like the operations in `deck.ts`, these are pure functions over the whole
// user and `null` is the refusal: a refused exchange changes nothing, and one
// that succeeds changes every side in the one returned state, so
// `UserService.apply` commits it as a single step.

/**
 * The user with one more copy of `card` and its purchase price spent, or
 * `null` when the Rosary balance is below the price. Geo is not touched.
 */
export function buyCard(state: UserState, card: Card): UserState | null {
  const price = purchasePrice(card);
  if (state.rosaries < price) return null;
  const key = cardKey(card);
  const collection = new Map(state.collection);
  collection.set(key, quantityOf(state.collection, card) + 1);
  return { ...state, rosaries: state.rosaries - price, collection };
}

/**
 * The user with one fewer copy of `card`, its sale price credited, and every
 * deck trimmed to the new quantity — or `null` when no copy is held. Geo is
 * not touched. Selling the last copy removes the card from the collection, so
 * it reads as owned zero times.
 */
export function sellCard(state: UserState, card: Card): UserState | null {
  const held = quantityOf(state.collection, card);
  if (held === 0) return null;
  const key = cardKey(card);
  const quantity = held - 1;
  const collection = new Map(state.collection);
  if (quantity === 0) collection.delete(key);
  else collection.set(key, quantity);
  return {
    ...state,
    rosaries: state.rosaries + salePrice(card),
    collection,
    decks: trimDecks(state.decks, key, quantity),
  };
}

/**
 * The indices of the decks selling one copy of `card` would trim, in order.
 * Empty when no copy is held, since that sale would not happen.
 *
 * Asked of the same `trimDecks` the sale runs, so a warning built from this
 * cannot disagree with what the sale then does.
 */
export function decksTrimmedBySale(state: UserState, card: Card): number[] {
  const held = quantityOf(state.collection, card);
  if (held === 0) return [];
  const trimmed = trimDecks(state.decks, cardKey(card), held - 1);
  const indices: number[] = [];
  trimmed.forEach((deck, i) => {
    if (deck !== state.decks[i]) indices.push(i);
  });
  return indices;
}
