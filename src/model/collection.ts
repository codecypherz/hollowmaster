import { Card, CardKey, CARD_DB, cardKey } from './card';

/** One card the player holds, with how many copies of it they hold. */
export interface OwnedCard {
  readonly card: Card;
  readonly quantity: number;
}

/**
 * The cards the collection holds, in catalogue order.
 *
 * Walking `CARD_DB` rather than the map is what makes the projection
 * deterministic: the map's own order is insertion order, which depends on
 * which packs the player opened in which order, so a sort applied to it would
 * inherit that. Walking the catalogue gives every sort the same starting
 * sequence whatever the player's history.
 *
 * A card held zero times is not in the collection and gets no entry.
 */
export function ownedCards(collection: ReadonlyMap<CardKey, number>): OwnedCard[] {
  const owned: OwnedCard[] = [];
  for (const card of CARD_DB) {
    const quantity = collection.get(cardKey(card)) ?? 0;
    if (quantity < 1) continue;
    owned.push({ card, quantity });
  }
  return owned;
}

// ─── Orders ─────────────────────────────────────────────────────────────────

/** What the collection can be ordered by. */
export type SortKey = 'rarity' | 'quantity' | 'name' | 'attack' | 'defense';

/**
 * An order: what it is called to the player, and the value it reads.
 *
 * Each order carries one fixed direction, stated here rather than chosen by
 * the player: the four numeric orders descend, because "show me my best cards"
 * is the only thing anybody means by them, and name ascends because A→Z is
 * what alphabetical means. A direction toggle doubles the control's states and
 * the test matrix for a need nobody has stated; it is additive later, since
 * `SortKey` can become `{ key, direction }` without any caller changing shape.
 */
export interface SortOrder {
  readonly key: SortKey;
  readonly label: string;
  /** Descending reads highest first; ascending reads A→Z. */
  readonly direction: 'asc' | 'desc';
}

export const SORTS: readonly SortOrder[] = Object.freeze([
  { key: 'rarity', label: 'Rarity', direction: 'desc' },
  { key: 'quantity', label: 'Quantity', direction: 'desc' },
  { key: 'name', label: 'Name', direction: 'asc' },
  { key: 'attack', label: 'Attack', direction: 'desc' },
  { key: 'defense', label: 'Defense', direction: 'desc' },
] as const);

/** The order the collection arrives in: the rarest cards first. */
export const DEFAULT_SORT: SortKey = 'rarity';

/**
 * The owned cards in the given order, as a new array.
 *
 * Every order is *total*. After the primary comparison the same tie-break
 * ladder runs for all five — name (A→Z), then catalogue identity — so cards
 * that tie on the chosen value are placed by a stated rule rather than left
 * wherever the sort happened to put them. Identity is unique by construction,
 * so the ladder always terminates and the same collection ordered the same way
 * reads the same sequence every time. That is what keeps the grid from
 * reshuffling under the player's hand when a signal re-emits.
 */
export function sortOwned(owned: readonly OwnedCard[], key: SortKey): OwnedCard[] {
  const order = SORTS.find((s) => s.key === key) ?? SORTS[0];
  return [...owned].sort((a, b) => {
    const primary = comparePrimary(a, b, order);
    if (primary !== 0) return primary;
    const byName = a.card.name.localeCompare(b.card.name, 'en');
    if (byName !== 0) return byName;
    return cardKey(a.card).localeCompare(cardKey(b.card), 'en');
  });
}

function comparePrimary(a: OwnedCard, b: OwnedCard, order: SortOrder): number {
  if (order.key === 'name') {
    return a.card.name.localeCompare(b.card.name, 'en');
  }
  const difference = valueOf(b, order.key) - valueOf(a, order.key);
  return order.direction === 'desc' ? difference : -difference;
}

function valueOf(owned: OwnedCard, key: Exclude<SortKey, 'name'>): number {
  switch (key) {
    case 'rarity':
      return owned.card.stars;
    case 'quantity':
      return owned.quantity;
    case 'attack':
      return owned.card.attack;
    case 'defense':
      return owned.card.defense;
  }
}
