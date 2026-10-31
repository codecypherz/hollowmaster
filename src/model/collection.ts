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

/** Descending reads highest first (Z→A for name); ascending reads lowest first (A→Z). */
export type SortDirection = 'asc' | 'desc';

/**
 * An order: what it is called to the player, and the direction it starts in.
 *
 * The player can reverse any order, but each one opens in the direction
 * anybody means by it: the four numeric orders descend, because "show me my
 * best cards" is what they are for, and name ascends because A→Z is what
 * alphabetical means.
 */
export interface SortOrder {
  readonly key: SortKey;
  readonly label: string;
  readonly defaultDirection: SortDirection;
}

export const SORTS: readonly SortOrder[] = Object.freeze([
  { key: 'rarity', label: 'Rarity', defaultDirection: 'desc' },
  { key: 'quantity', label: 'Quantity', defaultDirection: 'desc' },
  { key: 'name', label: 'Name', defaultDirection: 'asc' },
  { key: 'attack', label: 'Attack', defaultDirection: 'desc' },
  { key: 'defense', label: 'Defense', defaultDirection: 'desc' },
] as const);

/** The order the collection arrives in: the rarest cards first. */
export const DEFAULT_SORT: SortKey = 'rarity';

/** An order in effect: what it reads, and which way. */
export interface SortState {
  readonly key: SortKey;
  readonly direction: SortDirection;
}

/** The direction an order opens in. */
export function defaultDirection(key: SortKey): SortDirection {
  return (SORTS.find((s) => s.key === key) ?? SORTS[0]).defaultDirection;
}

/** The order in effect on arrival: rarity, rarest first. */
export const DEFAULT_SORT_STATE: SortState = Object.freeze({
  key: DEFAULT_SORT,
  direction: defaultDirection(DEFAULT_SORT),
});

/**
 * The order in effect after the player chooses `key`: the same key reverses
 * the direction, and a different key opens in its own default direction.
 */
export function nextSort(current: SortState, key: SortKey): SortState {
  if (current.key === key) {
    return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
  }
  return { key, direction: defaultDirection(key) };
}

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
 *
 * `direction` reverses the primary comparison only. The tie-break always runs
 * ascending, so reversing an order leaves tied cards in place among
 * themselves, and every order stays total in both directions.
 */
export function sortOwned(
  owned: readonly OwnedCard[],
  key: SortKey,
  direction: SortDirection = defaultDirection(key),
): OwnedCard[] {
  const sign = direction === 'asc' ? 1 : -1;
  return [...owned].sort((a, b) => {
    const primary = sign * comparePrimary(a, b, key);
    if (primary !== 0) return primary;
    const byName = a.card.name.localeCompare(b.card.name, 'en');
    if (byName !== 0) return byName;
    return cardKey(a.card).localeCompare(cardKey(b.card), 'en');
  });
}

/** Ascending comparison on the order's own value. */
function comparePrimary(a: OwnedCard, b: OwnedCard, key: SortKey): number {
  if (key === 'name') return a.card.name.localeCompare(b.card.name, 'en');
  return valueOf(a, key) - valueOf(b, key);
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

// ─── Rarity sections ────────────────────────────────────────────────────────

/** One run of the collection that shares a star rating. */
export interface RaritySection<T extends OwnedCard = OwnedCard> {
  readonly stars: number;
  /** The flat index, in the sorted list, of this section's first entry. */
  readonly start: number;
  readonly entries: readonly T[];
}

/**
 * The sorted list split into runs of one star rating each.
 *
 * A projection, not a sort: it walks the list as given, so the sections come
 * out in whatever direction the list is already in and the tie-break order
 * inside each is untouched. `start` lets a tile keep its flat index, so every
 * path that names a tile by its place in the sorted list keeps working. A
 * rating with no card is never a section.
 */
export function groupByRarity<T extends OwnedCard>(sorted: readonly T[]): RaritySection<T>[] {
  const sections: { stars: number; start: number; entries: T[] }[] = [];
  sorted.forEach((entry, index) => {
    const last = sections.at(-1);
    if (last && last.stars === entry.card.stars) {
      last.entries.push(entry);
    } else {
      sections.push({ stars: entry.card.stars, start: index, entries: [entry] });
    }
  });
  return sections;
}
