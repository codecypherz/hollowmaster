import { Card, CardKey, CARD_BY_KEY, cardKey, cardKeyOf } from './card';

/**
 * Everything a player owns: the cards they hold and the Geo they can spend.
 *
 * Neither is derived from the other, and the whole shape is plain data — no
 * class, no methods — so serializing it is a near-identity mapping rather than
 * a translation layer. The operations that change it are the pure functions
 * below; `UserService` is what holds one of these and publishes it.
 */
export interface UserState {
  /** Whole number of Geo, never negative. */
  readonly geo: number;
  /**
   * How many copies of each card the player holds, keyed by catalogue identity.
   * A card absent from the map is owned zero times — read it through
   * `quantityOf` so no caller has to special-case absence.
   */
  readonly collection: ReadonlyMap<CardKey, number>;
}

/**
 * The nine cards a new player starts with — Crawlid, Vengefly, Gruzzer,
 * Tiktik, Aspid Hatchling, Wandering Husk, Husk Hornhead, Leaping Husk, and
 * Husk Bully.
 *
 * Nine is `HAND_SIZE`: a new player owns exactly enough cards to field a hand,
 * and every one of them is the weakest rarity, so the Shop has somewhere to
 * go. These happen to be exactly the one-star cards today, and that is why
 * they were chosen — but the set is *stated* rather than derived, because
 * "every one-star card" would silently change both the starter set and how
 * many cards a new player gets the next time a one-star card is catalogued.
 */
export const STARTER_CARD_KEYS: readonly CardKey[] = Object.freeze([
  cardKeyOf('FC', 1), // Crawlid
  cardKeyOf('FC', 7), // Vengefly
  cardKeyOf('FC', 8), // Gruzzer
  cardKeyOf('FC', 9), // Tiktik
  cardKeyOf('FC', 10), // Aspid Hatchling
  cardKeyOf('FC', 11), // Wandering Husk
  cardKeyOf('FC', 12), // Husk Hornhead
  cardKeyOf('FC', 13), // Leaping Husk
  cardKeyOf('FC', 14), // Husk Bully
] as const);

/** How many cards a new player is seeded with. */
const STARTER_COUNT = 9;

/**
 * The starter list names cards by identity, so it can name one the catalogue
 * does not hold. Like the catalogue's own uniqueness check this runs at module
 * load, so a mis-stated key fails at app start rather than seeding a player a
 * card short.
 */
function assertStarterSet(keys: readonly CardKey[]): void {
  if (keys.length !== STARTER_COUNT) {
    throw new Error(`The starter set must hold exactly ${STARTER_COUNT} cards, got ${keys.length}`);
  }
  for (const key of keys) {
    if (!CARD_BY_KEY.has(key)) {
      throw new Error(`Starter card ${key} is not in the catalogue`);
    }
  }
}

assertStarterSet(STARTER_CARD_KEYS);

/** A user with no prior data: no Geo, and one copy of each starter card. */
export function seedUser(): UserState {
  return {
    geo: 0,
    collection: new Map(STARTER_CARD_KEYS.map((key) => [key, 1])),
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** How many copies of `card` the collection holds. Zero for one never owned. */
export function quantityOf(collection: ReadonlyMap<CardKey, number>, card: Card): number {
  return collection.get(cardKey(card)) ?? 0;
}

/**
 * The collection with `cards` added to it, one quantity each. Returns a new
 * map: the caller's collection is never touched, so a grant that is part of a
 * larger step can be discarded by simply not using the result.
 */
export function grantAll(
  collection: ReadonlyMap<CardKey, number>,
  cards: readonly Card[],
): ReadonlyMap<CardKey, number> {
  const next = new Map(collection);
  for (const card of cards) {
    const key = cardKey(card);
    next.set(key, (next.get(key) ?? 0) + 1);
  }
  return next;
}

/** Every copy of every card — three of one and one of another is four. */
export function totalCards(collection: ReadonlyMap<CardKey, number>): number {
  let total = 0;
  for (const quantity of collection.values()) total += quantity;
  return total;
}

/** How many different cards are held, regardless of quantity. */
export function distinctCards(collection: ReadonlyMap<CardKey, number>): number {
  return collection.size;
}

// ─── Persistence ────────────────────────────────────────────────────────────

/**
 * The shape persisted data is written in. Checked for exact equality on read:
 * a missing version, a newer one, or a non-number is unreadable rather than
 * hopefully-current. There is nothing to migrate from — version 1 is the first
 * shape written — so a later shape either bumps this and adds a reader for the
 * old one, or bumps it and accepts that existing players are reseeded.
 */
export const SCHEMA_VERSION = 1;

/** One card's holding, as it is stored: identity and quantity, nothing else. */
export interface PersistedEntry {
  readonly set: string;
  readonly number: number;
  readonly quantity: number;
}

/**
 * The whole persisted record.
 *
 * The collection is an array of self-describing entries rather than an object
 * keyed by `FC#7`, because a composite key would have to be parsed back out of
 * a string and a hand-inspected record should say what its fields are. This is
 * the one place the array shape beats the map shape, and it is a boundary, so
 * the conversion is paid once on each side.
 *
 * Card *properties* — name, artwork, stats, arrows, ability — are deliberately
 * absent: a card's text can be rewritten without invalidating anyone's save.
 */
export interface PersistedUser {
  readonly version: number;
  readonly geo: number;
  readonly collection: readonly PersistedEntry[];
}

export function toPersisted(state: UserState): PersistedUser {
  const collection: PersistedEntry[] = [];
  for (const [key, quantity] of state.collection) {
    const card = CARD_BY_KEY.get(key);
    if (!card) continue;
    collection.push({ set: card.set, number: card.number, quantity });
  }
  return { version: SCHEMA_VERSION, geo: state.geo, collection };
}

/**
 * Reads a stored record back, or reports that it cannot.
 *
 * `card.ts` throws on invalid input because its input is hand-authored source.
 * This is the application's first *external* input and the opposite rule
 * applies: it never throws. A malformed envelope — wrong version, wrong root
 * shape, an impossible balance — costs the whole record and the caller seeds a
 * fresh user. A malformed *entry* costs only that entry, so one unknown or
 * corrupt card never costs the player the rest of their collection or their
 * Geo.
 */
export function parsePersistedUser(raw: unknown): PersistedUser | null {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null;
  const record = raw as Record<string, unknown>;

  if (record['version'] !== SCHEMA_VERSION) return null;
  if (!isCount(record['geo'])) return null;
  if (!Array.isArray(record['collection'])) return null;

  const collection: PersistedEntry[] = [];
  for (const entry of record['collection'] as unknown[]) {
    const parsed = parseEntry(entry);
    if (parsed) collection.push(parsed);
  }

  return { version: SCHEMA_VERSION, geo: record['geo'], collection };
}

/** Turns a read record back into state, dropping cards the catalogue has lost. */
export function fromPersisted(persisted: PersistedUser): UserState {
  const collection = new Map<CardKey, number>();
  for (const entry of persisted.collection) {
    const key = cardKeyOf(entry.set, entry.number);
    if (!CARD_BY_KEY.has(key)) continue;
    collection.set(key, (collection.get(key) ?? 0) + entry.quantity);
  }
  return { geo: persisted.geo, collection };
}

function parseEntry(raw: unknown): PersistedEntry | null {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null;
  const entry = raw as Record<string, unknown>;

  const set = entry['set'];
  const number = entry['number'];
  const quantity = entry['quantity'];
  if (typeof set !== 'string' || set === '') return null;
  if (!Number.isInteger(number) || (number as number) < 1) return null;
  // A quantity of zero is not a holding, and neither is a fraction or a
  // negative — none of them is a card the player owns.
  if (!isCount(quantity) || quantity === 0) return null;

  return { set, number: number as number, quantity };
}

/** A whole number of zero or more — what both a balance and a quantity are. */
function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}
