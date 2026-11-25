import { TestBed } from '@angular/core/testing';
import { LocalStorageUserStore, STORAGE_KEY, USER_STORE, UserStore } from './user-store';
import { UserService } from './user.service';
import { CARD_BY_KEY, cardKey, cardKeyOf } from '../model/card';
import { DECK_SIZE, MAX_DECKS, emptyDeck } from '../model/deck';
import { knowsRate, settleOrder } from '../model/exchange';
import {
  NO_MILESTONES,
  PersistedUser,
  SCHEMA_VERSION,
  distinctCards,
  fromPersisted,
  grantAll,
  parsePersistedUser,
  seedUser,
  toPersisted,
  totalCards,
} from '../model/user';

const crawlid = CARD_BY_KEY.get(cardKeyOf('FC', 1))!;
const goam = CARD_BY_KEY.get(cardKeyOf('FC', 6))!;

/** The substitutable store a test provides through the token. */
class InMemoryUserStore implements UserStore {
  saved: PersistedUser[] = [];
  constructor(private stored: PersistedUser | null = null) {}
  async load(): Promise<PersistedUser | null> {
    return this.stored;
  }
  async save(user: PersistedUser): Promise<void> {
    this.saved.push(user);
    this.stored = user;
  }
}

/** Just enough of Node's process to watch for an unhandled rejection. */
interface NodeLike {
  on?(event: string, listener: () => void): unknown;
  off?(event: string, listener: () => void): unknown;
}

/** A store that fails whatever it is asked to do. */
class BrokenUserStore implements UserStore {
  async load(): Promise<PersistedUser | null> {
    throw new Error('unavailable');
  }
  async save(): Promise<void> {
    throw new Error('full');
  }
}

// ─── 4.2 / 4.3 The serialized shape and its reader ──────────────────────────

describe('the persisted shape', () => {
  it('round-trips a user holding duplicates', () => {
    const original = {
      geo: 350,
      rosaries: 70,
      collection: grantAll(seedUser().collection, [crawlid, crawlid, goam]),
      decks: [],
      battleDeck: null,
      milestones: { peakRosaries: 90, rarestHeld: 5 },
    };
    const restored = fromPersisted(
      parsePersistedUser(JSON.parse(JSON.stringify(toPersisted(original))))!,
    );

    expect(restored.geo).toBe(350);
    expect(restored.rosaries).toBe(70);
    expect(restored.milestones).toEqual({ peakRosaries: 90, rarestHeld: 5 });
    expect(totalCards(restored.collection)).toBe(totalCards(original.collection));
    expect(distinctCards(restored.collection)).toBe(distinctCards(original.collection));
    expect([...restored.collection.entries()].sort()).toEqual(
      [...original.collection.entries()].sort(),
    );
  });

  it('states a set, a number, and a quantity, and nothing else about a card', () => {
    const persisted = toPersisted({
      geo: 12,
      rosaries: 0,
      collection: grantAll(new Map(), [goam, goam]),
      decks: [],
      battleDeck: null,
      milestones: { peakRosaries: 0, rarestHeld: 4 },
    });
    expect(persisted).toEqual({
      version: SCHEMA_VERSION,
      geo: 12,
      rosaries: 0,
      collection: [{ set: 'FC', number: 6, quantity: 2 }],
      decks: [],
      battleDeck: null,
      milestones: { peakRosaries: 0, rarestHeld: 4 },
    });

    const json = JSON.stringify(toPersisted(seedUser()));
    for (const leak of [goam.name, 'Crawlid', '.webp', '/images/', 'ability', 'arrows', 'stars']) {
      expect(json).not.toContain(leak);
    }
    for (const card of CARD_BY_KEY.values()) {
      expect(json).not.toContain(card.name);
      expect(json).not.toContain(card.image);
      expect(json).not.toContain(card.ability);
    }
  });

  it("survives a catalogued card's properties being edited", () => {
    // The record names FC#6 only; whatever FC#6 says about itself today is
    // resolved at load time, never stored.
    const persisted = toPersisted({
      geo: 0,
      rosaries: 0,
      collection: new Map([[cardKeyOf('FC', 6), 3]]),
      decks: [],
      battleDeck: null,
      milestones: NO_MILESTONES,
    });
    expect(persisted.collection).toEqual([{ set: 'FC', number: 6, quantity: 3 }]);
    expect(fromPersisted(persisted).collection.get(cardKeyOf('FC', 6))).toBe(3);
  });

  it('writes the current schema version', () => {
    expect(toPersisted(seedUser()).version).toBe(SCHEMA_VERSION);
  });
});

describe('parsePersistedUser', () => {
  const valid = (): Record<string, unknown> => ({
    version: SCHEMA_VERSION,
    geo: 100,
    rosaries: 30,
    collection: [{ set: 'FC', number: 1, quantity: 2 }],
    decks: [],
    milestones: { peakRosaries: 80, rarestHeld: 3 },
  });

  it('accepts a well-formed record', () => {
    expect(parsePersistedUser(valid())).toEqual({
      version: SCHEMA_VERSION,
      geo: 100,
      rosaries: 30,
      collection: [{ set: 'FC', number: 1, quantity: 2 }],
      decks: [],
      battleDeck: null,
      milestones: { peakRosaries: 80, rarestHeld: 3 },
    });
  });

  it('rejects a bad envelope outright', () => {
    const bad: unknown[] = [
      null,
      undefined,
      'a string',
      42,
      [],
      { ...valid(), version: undefined },
      { ...valid(), version: SCHEMA_VERSION + 1 },
      { ...valid(), version: String(SCHEMA_VERSION) },
      { ...valid(), geo: -1 },
      { ...valid(), geo: 12.5 },
      { ...valid(), geo: '100' },
      { ...valid(), geo: Number.NaN },
      { ...valid(), rosaries: -1 },
      { ...valid(), rosaries: 2.5 },
      { ...valid(), rosaries: '30' },
      { ...valid(), rosaries: undefined },
      { ...valid(), collection: 'not an array' },
      { ...valid(), collection: undefined },
    ];
    for (const raw of bad) expect(parsePersistedUser(raw)).toBeNull();
  });

  it('never throws, whatever it is handed', () => {
    for (const raw of [Symbol('x'), () => {}, new Map(), { collection: [null, 1, 'x'] }]) {
      expect(() => parsePersistedUser(raw)).not.toThrow();
    }
  });

  it('drops a bad entry rather than the record', () => {
    const parsed = parsePersistedUser({
      version: SCHEMA_VERSION,
      geo: 42,
      rosaries: 0,
      collection: [
        { set: 'FC', number: 1, quantity: 1 },
        { set: 'FC', number: 2, quantity: -1 },
        { set: 'FC', number: 3, quantity: 1.5 },
        { set: 'FC', number: 4, quantity: '2' },
        { set: 'FC', number: 5, quantity: 0 },
        { set: 'FC', number: 6 },
        { set: '', number: 7, quantity: 1 },
        { set: 'FC', number: 0, quantity: 1 },
        { number: 8, quantity: 1 },
        null,
        'nonsense',
      ],
    })!;

    expect(parsed.geo).toBe(42);
    expect(parsed.collection).toEqual([{ set: 'FC', number: 1, quantity: 1 }]);
    expect(parsed.decks).toEqual([]);
  });

  it('restores five known cards and the full balance when one card is unknown', () => {
    const parsed = parsePersistedUser({
      version: SCHEMA_VERSION,
      geo: 777,
      rosaries: 0,
      collection: [
        { set: 'FC', number: 1, quantity: 1 },
        { set: 'FC', number: 2, quantity: 1 },
        { set: 'FC', number: 3, quantity: 1 },
        { set: 'FC', number: 4, quantity: 1 },
        { set: 'FC', number: 5, quantity: 1 },
        { set: 'GONE', number: 99, quantity: 4 },
      ],
    })!;

    const state = fromPersisted(parsed);
    expect(state.geo).toBe(777);
    expect(distinctCards(state.collection)).toBe(5);
    expect(totalCards(state.collection)).toBe(5);
    expect(state.collection.has(cardKeyOf('GONE', 99))).toBe(false);
  });
});

// ─── Decks in the persisted record ──────────────────────────────────────────

describe('persisted decks', () => {
  const three = [
    { cards: [] },
    { cards: [cardKey(crawlid), cardKey(crawlid), cardKey(goam)] },
    { cards: Array<ReturnType<typeof cardKey>>(DECK_SIZE).fill(cardKey(goam)) },
  ];
  const holdings = new Map([
    [cardKey(crawlid), 2],
    [cardKey(goam), DECK_SIZE],
  ]);

  it('writes a current record carrying its decks', () => {
    const persisted = toPersisted({
      geo: 0,
      rosaries: 0,
      collection: holdings,
      decks: three,
      battleDeck: null,
      milestones: NO_MILESTONES,
    });
    expect(persisted.version).toBe(SCHEMA_VERSION);
    expect(persisted.decks).toHaveLength(3);
    expect(persisted.decks[0]).toEqual([]);
    expect(persisted.decks[1]).toEqual([
      { set: 'FC', number: 1 },
      { set: 'FC', number: 1 },
      { set: 'FC', number: 6 },
    ]);
  });

  it("names a deck's cards and nothing else about them", () => {
    const json = JSON.stringify(
      toPersisted({
        geo: 0,
        rosaries: 0,
        collection: holdings,
        decks: three,
        battleDeck: null,
        milestones: NO_MILESTONES,
      }),
    );
    for (const card of CARD_BY_KEY.values()) {
      expect(json).not.toContain(card.name);
      expect(json).not.toContain(card.image);
      expect(json).not.toContain(card.ability);
    }
    for (const leak of ['stars', 'arrows', 'attack', 'defense', 'ability']) {
      expect(json).not.toContain(leak);
    }
  });

  it('round-trips three decks in order, contents, and positions', () => {
    const original = {
      geo: 40,
      rosaries: 0,
      collection: holdings,
      decks: three,
      battleDeck: null,
      milestones: NO_MILESTONES,
    };
    const restored = fromPersisted(
      parsePersistedUser(JSON.parse(JSON.stringify(toPersisted(original))))!,
    );

    expect(restored.decks).toEqual(three);
  });

  it('drops a deck card the catalogue has lost, keeping the rest in order', () => {
    const parsed = parsePersistedUser({
      version: 2,
      geo: 0,
      collection: [
        { set: 'FC', number: 1, quantity: 1 },
        { set: 'FC', number: 6, quantity: 1 },
      ],
      decks: [
        [
          { set: 'FC', number: 1 },
          { set: 'GONE', number: 99 },
          { set: 'FC', number: 6 },
        ],
      ],
    })!;

    expect(fromPersisted(parsed).decks[0].cards).toEqual([cardKey(crawlid), cardKey(goam)]);
  });

  it('drops a deck position the restored collection does not hold', () => {
    const parsed = parsePersistedUser({
      version: 2,
      geo: 0,
      collection: [{ set: 'FC', number: 1, quantity: 1 }],
      decks: [
        [
          { set: 'FC', number: 6 },
          { set: 'FC', number: 1 },
        ],
      ],
    })!;

    expect(fromPersisted(parsed).decks[0].cards).toEqual([cardKey(crawlid)]);
  });

  it('never restores a deck card the collection does not hold', () => {
    const state = fromPersisted(
      parsePersistedUser({
        version: 2,
        geo: 0,
        collection: [{ set: 'FC', number: 1, quantity: 1 }],
        decks: [
          [{ set: 'FC', number: 6 }],
          [
            { set: 'FC', number: 1 },
            { set: 'GONE', number: 1 },
          ],
          'not a deck',
        ],
      })!,
    );

    for (const deck of state.decks) {
      for (const key of deck.cards) {
        expect(state.collection.get(key) ?? 0).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('drops a deck that is not a list of card identities, costing only itself', () => {
    const parsed = parsePersistedUser({
      version: 2,
      geo: 99,
      collection: [{ set: 'FC', number: 1, quantity: 1 }],
      decks: [[{ set: 'FC', number: 1 }], 'nonsense', [{ set: 'FC', number: 1 }]],
    })!;

    const state = fromPersisted(parsed);
    expect(state.decks).toHaveLength(2);
    expect(state.geo).toBe(99);
    expect(state.collection.get(cardKey(crawlid))).toBe(1);
  });

  it('keeps the first nine decks and the first nine positions of a deck', () => {
    const parsed = parsePersistedUser({
      version: 2,
      geo: 0,
      collection: [{ set: 'FC', number: 1, quantity: DECK_SIZE + 4 }],
      decks: Array.from({ length: MAX_DECKS + 3 }, () =>
        Array.from({ length: DECK_SIZE + 4 }, () => ({ set: 'FC', number: 1 })),
      ),
    })!;

    const state = fromPersisted(parsed);
    expect(state.decks).toHaveLength(MAX_DECKS);
    for (const deck of state.decks) expect(deck.cards).toHaveLength(DECK_SIZE);
  });

  it('keeps the first copies up to the quantity held, the rest in order', () => {
    const c = { set: 'FC', number: 1 };
    const g = { set: 'FC', number: 6 };
    const v = { set: 'FC', number: 7 };
    const parsed = parsePersistedUser({
      version: 2,
      geo: 0,
      collection: [
        { set: 'FC', number: 1, quantity: 2 },
        { set: 'FC', number: 6, quantity: 1 },
        { set: 'FC', number: 7, quantity: 1 },
      ],
      decks: [[c, g, c, v, c, c]],
    })!;

    expect(fromPersisted(parsed).decks[0].cards).toEqual([
      cardKey(crawlid),
      cardKey(goam),
      cardKey(crawlid),
      cardKeyOf('FC', 7),
    ]);
  });

  it('trims copies per deck, so two decks may each keep the one held copy', () => {
    const parsed = parsePersistedUser({
      version: 2,
      geo: 0,
      collection: [{ set: 'FC', number: 1, quantity: 1 }],
      decks: [[{ set: 'FC', number: 1 }], [{ set: 'FC', number: 1 }]],
    })!;

    const state = fromPersisted(parsed);
    expect(state.decks.map((d) => d.cards)).toEqual([[cardKey(crawlid)], [cardKey(crawlid)]]);
  });

  it('never restores more copies in a deck than the collection holds', () => {
    const state = fromPersisted(
      parsePersistedUser({
        version: 2,
        geo: 0,
        collection: [
          { set: 'FC', number: 1, quantity: 3 },
          { set: 'FC', number: 6, quantity: 1 },
        ],
        decks: [
          Array.from({ length: DECK_SIZE }, (_, i) => ({ set: 'FC', number: i % 2 ? 1 : 6 })),
        ],
      })!,
    );

    for (const deck of state.decks) {
      const counts = new Map<string, number>();
      for (const key of deck.cards) counts.set(key, (counts.get(key) ?? 0) + 1);
      for (const [key, copies] of counts) {
        expect(state.collection.get(key as ReturnType<typeof cardKey>) ?? 0).toBeGreaterThanOrEqual(
          copies,
        );
      }
    }
  });

  it('loses only the decks when the field is not an array at all', () => {
    const parsed = parsePersistedUser({
      version: 2,
      geo: 7,
      collection: [{ set: 'FC', number: 1, quantity: 1 }],
      decks: 'nonsense',
    })!;

    expect(parsed.decks).toEqual([]);
    expect(parsed.geo).toBe(7);
  });

  it('rejects a version the application does not know', () => {
    const record = {
      version: SCHEMA_VERSION + 1,
      geo: 0,
      collection: [{ set: 'FC', number: 1, quantity: 1 }],
      decks: [],
    };
    expect(parsePersistedUser(record)).toBeNull();
  });
});

describe('a version 1 record', () => {
  const v1 = (collection: unknown[]) => ({ version: 1, geo: 480, collection });

  it('restores its collection and its balance in full', () => {
    const state = fromPersisted(
      parsePersistedUser(
        v1([
          { set: 'FC', number: 1, quantity: 2 },
          { set: 'FC', number: 6, quantity: 1 },
        ]),
      )!,
    );

    expect(state.geo).toBe(480);
    expect(totalCards(state.collection)).toBe(3);
    expect(state.collection.get(cardKey(crawlid))).toBe(2);
  });

  it('upgrades to a user holding no decks', () => {
    const parsed = parsePersistedUser(v1([{ set: 'FC', number: 1, quantity: 1 }]))!;
    expect(parsed.decks).toEqual([]);
    expect(fromPersisted(parsed).decks).toEqual([]);
  });

  it('still drops only the unknown card', () => {
    const state = fromPersisted(
      parsePersistedUser(
        v1([
          { set: 'FC', number: 1, quantity: 1 },
          { set: 'GONE', number: 99, quantity: 5 },
          { set: 'FC', number: 6, quantity: 1 },
        ]),
      )!,
    );

    expect(distinctCards(state.collection)).toBe(2);
    expect(state.geo).toBe(480);
  });

  it('reports the version it was read at, not the one it will be written at', () => {
    expect(parsePersistedUser(v1([]))!.version).toBe(1);
  });

  it('upgrades to a user holding no Rosaries', () => {
    expect(fromPersisted(parsePersistedUser(v1([]))!).rosaries).toBe(0);
  });
});

describe('a version 2 record', () => {
  const v2 = (extra: Record<string, unknown> = {}) => ({
    version: 2,
    geo: 210,
    collection: [
      { set: 'FC', number: 1, quantity: 2 },
      { set: 'FC', number: 6, quantity: 1 },
    ],
    decks: [
      [
        { set: 'FC', number: 1 },
        { set: 'FC', number: 6 },
      ],
      [],
    ],
    ...extra,
  });

  it('restores its collection, its Geo, and every deck in full, with no Rosaries', () => {
    const state = fromPersisted(parsePersistedUser(v2())!);
    expect(state.geo).toBe(210);
    expect(state.rosaries).toBe(0);
    expect(state.collection.get(cardKey(crawlid))).toBe(2);
    expect(state.decks).toEqual([{ cards: [cardKey(crawlid), cardKey(goam)] }, { cards: [] }]);
  });

  it('ignores a stray Rosary field, which the shape did not have', () => {
    expect(parsePersistedUser(v2({ rosaries: 999 }))!.rosaries).toBe(0);
  });

  it('reports the version it was read at', () => {
    expect(parsePersistedUser(v2())!.version).toBe(2);
  });
});

describe('a version 3 record', () => {
  const v3 = (extra: Record<string, unknown> = {}) => ({
    version: 3,
    geo: 210,
    rosaries: 12000,
    collection: [
      { set: 'FC', number: 1, quantity: 2 },
      { set: 'FC', number: 6, quantity: 1 },
    ],
    decks: [[{ set: 'FC', number: 6 }]],
    ...extra,
  });

  it('restores everything it holds, its Rosaries included', () => {
    const state = fromPersisted(parsePersistedUser(v3())!);
    expect(state.geo).toBe(210);
    expect(state.rosaries).toBe(12000);
    expect(totalCards(state.collection)).toBe(3);
    expect(state.decks).toEqual([{ cards: [cardKey(goam)] }]);
  });

  it('is restored with the milestones it proves, and no others', () => {
    const proved = { peakRosaries: 12000, rarestHeld: 4 };
    expect(fromPersisted(parsePersistedUser(v3())!).milestones).toEqual(proved);
    const stray = v3({ milestones: { peakRosaries: 99999, rarestHeld: 6 } });
    expect(fromPersisted(parsePersistedUser(stray)!).milestones).toEqual(proved);
  });

  it('still requires a possible Rosary balance', () => {
    for (const rosaries of [-1, 2.5, '30', undefined]) {
      expect(parsePersistedUser(v3({ rosaries }))).toBeNull();
    }
  });

  it('reports the version it was read at', () => {
    expect(parsePersistedUser(v3())!.version).toBe(3);
  });
});

// ─── The remembered battle deck ─────────────────────────────────────────────

/** Nine starter cards: a Ready deck the starter collection can hold. */
const READY_REFS = [1, 7, 8, 9, 10, 11, 12, 13, 14].map((number) => ({ set: 'FC', number }));
const STARTER_HOLDINGS = READY_REFS.map((ref) => ({ ...ref, quantity: 1 }));

describe('a version 4 record', () => {
  const v4 = () => ({
    version: 4,
    geo: 320,
    rosaries: 45,
    collection: STARTER_HOLDINGS,
    decks: [READY_REFS, [{ set: 'FC', number: 1 }]],
    milestones: { peakRosaries: 900, rarestHeld: 1 },
  });

  it('restores everything it holds, and remembers no battle deck', () => {
    const state = fromPersisted(parsePersistedUser(v4())!);
    expect(state.geo).toBe(320);
    expect(state.rosaries).toBe(45);
    expect(totalCards(state.collection)).toBe(9);
    expect(state.decks).toHaveLength(2);
    expect(state.decks[0].cards).toHaveLength(DECK_SIZE);
    expect(state.milestones).toEqual({ peakRosaries: 900, rarestHeld: 1 });
    expect(state.battleDeck).toBeNull();
  });

  it('ignores a stray battle deck, which the shape did not have', () => {
    expect(parsePersistedUser({ ...v4(), battleDeck: 0 })!.battleDeck).toBeNull();
  });

  it('is rewritten at the current version on load', async () => {
    const store = new InMemoryUserStore(parsePersistedUser(v4()));
    TestBed.configureTestingModule({ providers: [{ provide: USER_STORE, useValue: store }] });
    const users = TestBed.inject(UserService);
    await users.load();

    expect(store.saved).toHaveLength(1);
    expect(store.saved[0].version).toBe(SCHEMA_VERSION);
    expect(store.saved[0].battleDeck).toBeNull();
    expect(store.saved[0].geo).toBe(320);
    expect(store.saved[0].rosaries).toBe(45);
    expect(store.saved[0].decks).toEqual(v4().decks);
    expect(store.saved[0].milestones).toEqual({ peakRosaries: 900, rarestHeld: 1 });
    expect(users.state().battleDeck).toBeNull();
  });
});

describe('the persisted battle deck', () => {
  const record = (battleDeck: unknown) => ({
    version: SCHEMA_VERSION,
    geo: 70,
    rosaries: 5,
    collection: STARTER_HOLDINGS,
    decks: [READY_REFS, READY_REFS, [{ set: 'FC', number: 1 }]],
    battleDeck,
    milestones: { peakRosaries: 5, rarestHeld: 1 },
  });
  const restore = (raw: unknown) => fromPersisted(parsePersistedUser(raw)!);

  it('round-trips a remembered deck', () => {
    const state = { ...restore(record(null)), battleDeck: 1 };
    const persisted = toPersisted(state);
    expect(persisted.battleDeck).toBe(1);
    expect(restore(JSON.parse(JSON.stringify(persisted))).battleDeck).toBe(1);
  });

  it('reads an impossible value as none, without costing the record', () => {
    for (const value of [-1, 1.5, '1', undefined, Number.NaN, {}]) {
      const raw = record(value);
      if (value === undefined) delete (raw as Record<string, unknown>)['battleDeck'];
      const state = restore(raw);
      expect(state.battleDeck).toBeNull();
      expect(state.geo).toBe(70);
      expect(state.rosaries).toBe(5);
      expect(state.decks).toHaveLength(3);
      expect(totalCards(state.collection)).toBe(9);
    }
  });

  it('reads a position beyond the restored decks as none', () => {
    expect(restore(record(3)).battleDeck).toBeNull();
    expect(restore(record(8)).battleDeck).toBeNull();
  });

  it('keeps a remembered deck that is not Ready', () => {
    expect(restore(record(2)).battleDeck).toBe(2);
  });
});

describe('persisted milestones', () => {
  const record = (milestones: unknown, rosaries = 300) => ({
    version: SCHEMA_VERSION,
    geo: 5,
    rosaries,
    collection: [{ set: 'FC', number: 6, quantity: 1 }], // four stars
    decks: [[{ set: 'FC', number: 6 }]],
    milestones,
  });
  const restore = (raw: unknown) => fromPersisted(parsePersistedUser(raw)!);

  it('are proved by the records of versions 1 and 2', () => {
    const collection = [{ set: 'FC', number: 6, quantity: 1 }];
    for (const version of [1, 2]) {
      expect(restore({ version, geo: 5, collection, decks: [] }).milestones).toEqual({
        peakRosaries: 0,
        rarestHeld: 4,
      });
    }
  });

  it('survive a round trip after the Rosaries are spent', () => {
    const spender = restore(record({ peakRosaries: 9999, rarestHeld: 4 }, 9999));
    const spent = settleOrder(spender, [{ key: cardKey(goam), action: 'buy', quantity: 101 }])!;
    expect(spent.rosaries).toBe(0);
    const reloaded = restore(JSON.parse(JSON.stringify(toPersisted(spent))));
    expect(reloaded.milestones.peakRosaries).toBe(9999);
    expect(knowsRate(reloaded, 6)).toBe(true);
  });

  it('are raised to what the record holds', () => {
    expect(restore(record({ peakRosaries: 10, rarestHeld: 1 })).milestones).toEqual({
      peakRosaries: 300,
      rarestHeld: 4,
    });
  });

  it('cost only themselves when they are missing or impossible', () => {
    const impossible = (peakRosaries: unknown, rarestHeld: unknown) =>
      restore(record({ peakRosaries, rarestHeld })).milestones;
    for (const peak of [-1, 2.5, '9999', Number.NaN, null, undefined]) {
      expect(impossible(peak, 5), `${peak}`).toEqual({ peakRosaries: 300, rarestHeld: 5 });
    }
    for (const rarest of [9, 7, -1, 4.5, '6', null, undefined]) {
      expect(impossible(800, rarest), `${rarest}`).toEqual({ peakRosaries: 800, rarestHeld: 4 });
    }
    for (const whole of [undefined, null, 'nonsense', 4, [1, 2]]) {
      const state = restore(record(whole));
      expect(state.milestones).toEqual({ peakRosaries: 300, rarestHeld: 4 });
      expect([state.geo, state.rosaries]).toEqual([5, 300]);
      expect(totalCards(state.collection)).toBe(1);
      expect(state.decks).toEqual([{ cards: [cardKey(goam)] }]);
    }
  });

  it('are not proved by a card the catalogue has lost', () => {
    const lost = { ...record(undefined), collection: [{ set: 'GONE', number: 1, quantity: 1 }] };
    expect(restore(lost).milestones.rarestHeld).toBe(0);
  });
});

// ─── 4.4 The localStorage implementation ────────────────────────────────────

describe('LocalStorageUserStore', () => {
  const store = new LocalStorageUserStore();

  afterEach(() => {
    localStorage.clear();
  });

  it('round-trips through one named key', async () => {
    await store.save(
      toPersisted({
        geo: 25,
        rosaries: 15,
        collection: grantAll(new Map(), [goam]),
        decks: [],
        battleDeck: null,
        milestones: { peakRosaries: 15, rarestHeld: 4 },
      }),
    );
    expect(localStorage.getItem(STORAGE_KEY)).toBeTruthy();
    expect(Object.keys(localStorage)).toEqual([STORAGE_KEY]);
    expect(await store.load()).toEqual({
      version: SCHEMA_VERSION,
      geo: 25,
      rosaries: 15,
      collection: [{ set: 'FC', number: 6, quantity: 1 }],
      decks: [],
      battleDeck: null,
      milestones: { peakRosaries: 15, rarestHeld: 4 },
    });
  });

  it('resolves to null with nothing stored', async () => {
    expect(await store.load()).toBeNull();
  });

  it('resolves to null on unparseable or invalid stored text', async () => {
    for (const text of ['{not json', '"a string"', '{"version":99}', 'null']) {
      localStorage.setItem(STORAGE_KEY, text);
      expect(await store.load()).toBeNull();
    }
  });

  it('survives a store that throws on read', async () => {
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('unavailable');
    });
    await expect(store.load()).resolves.toBeNull();
    spy.mockRestore();
  });

  it('survives a store that throws on write', async () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });
    await expect(store.save(toPersisted(seedUser()))).resolves.toBeUndefined();
    spy.mockRestore();
  });
});

// ─── 4.5 / 4.6 The service against the port ─────────────────────────────────

describe('UserService persistence', () => {
  /** The whole substitution: one `providers` entry. */
  function withStore(store: UserStore): UserService {
    TestBed.configureTestingModule({ providers: [{ provide: USER_STORE, useValue: store }] });
    return TestBed.inject(UserService);
  }

  it('restores a stored user on load', async () => {
    const us = withStore(
      new InMemoryUserStore({
        version: SCHEMA_VERSION,
        geo: 640,
        rosaries: 0,
        collection: [{ set: 'FC', number: 6, quantity: 2 }],
        decks: [],
        battleDeck: null,
        milestones: NO_MILESTONES,
      }),
    );
    await us.load();
    expect(us.geo()).toBe(640);
    expect(us.totalCards()).toBe(2);
    expect(us.collection().get(cardKeyOf('FC', 6))).toBe(2);
  });

  it('seeds a user against an empty store, and persists that seed', async () => {
    const store = new InMemoryUserStore(null);
    const us = withStore(store);
    await us.load();

    expect(us.geo()).toBe(0);
    expect(us.totalCards()).toBe(9);
    expect(store.saved).toHaveLength(1);

    // A further load restores the seed rather than reseeding.
    await us.load();
    expect(store.saved).toHaveLength(1);
    expect(us.totalCards()).toBe(9);
  });

  it('seeds a user against a store that cannot be read at all', async () => {
    const us = withStore(new BrokenUserStore());
    await expect(us.load()).resolves.toBeUndefined();
    expect(us.geo()).toBe(0);
    expect(us.totalCards()).toBe(9);
    expect(us.distinctCards()).toBe(9);
  });

  it('writes through after every mutation', async () => {
    const store = new InMemoryUserStore(null);
    const us = withStore(store);
    await us.load();
    store.saved = [];

    us.creditGeo(500);
    expect(store.saved).toHaveLength(1);
    expect(store.saved[0].geo).toBe(500);

    us.grantCards([goam]);
    expect(store.saved).toHaveLength(2);

    expect(us.purchase(100, [crawlid, crawlid])).toBe(true);
    expect(store.saved).toHaveLength(3);
    expect(store.saved[2].geo).toBe(400);
  });

  it('writes a current record back after upgrading a version 1 one', async () => {
    // What a real store hands back for a stored version 1 record: the reader
    // has already upgraded it to hold no decks, and it still reports the
    // version it was read at.
    const store = new InMemoryUserStore({
      version: 1,
      geo: 300,
      rosaries: 0,
      collection: [{ set: 'FC', number: 1, quantity: 2 }],
      decks: [],
      battleDeck: null,
      milestones: NO_MILESTONES,
    });
    const us = withStore(store);

    await us.load();

    expect(us.geo()).toBe(300);
    expect(us.decks()).toEqual([]);
    expect(store.saved).toHaveLength(1);
    expect(store.saved[0].version).toBe(SCHEMA_VERSION);

    // The upgraded record is now current, so a second load restores it
    // directly and writes nothing further.
    await us.load();
    expect(store.saved).toHaveLength(1);
    expect(us.geo()).toBe(300);
  });

  it('writes once per successful deck command and not at all for a refused one', async () => {
    const store = new InMemoryUserStore(null);
    const us = withStore(store);
    await us.load();
    store.saved = [];

    expect(us.createDeck()).toBe(true);
    expect(store.saved).toHaveLength(1);

    expect(us.addCardToDeck(1, crawlid)).toBe(true);
    expect(store.saved).toHaveLength(2);
    expect(store.saved[1].decks[1]).toEqual([{ set: 'FC', number: 1 }]);

    expect(us.removeCardFromDeck(1, 0)).toBe(true);
    expect(store.saved).toHaveLength(3);

    expect(us.deleteDeck(1)).toBe(true);
    expect(store.saved).toHaveLength(4);

    expect(us.addCardToDeck(9, crawlid)).toBe(false);
    expect(us.removeCardFromDeck(0, 0)).toBe(false);
    expect(us.deleteDeck(7)).toBe(false);
    expect(us.addCardToDeck(0, goam)).toBe(false);
    expect(store.saved).toHaveLength(4);
  });

  it('issues no write for a refused credit or a failed purchase', async () => {
    const store = new InMemoryUserStore(null);
    const us = withStore(store);
    await us.load();
    store.saved = [];

    expect(us.purchase(100, [crawlid])).toBe(false);
    us.creditGeo(0);
    us.creditGeo(-50);
    us.grantCards([]);
    expect(store.saved).toEqual([]);
  });

  it('is the only thing in the application that touches the underlying store', async () => {
    // With the boundary fulfilled by a different implementation, nothing else
    // reaches for localStorage — not the service, not a mutation, not a
    // purchase. Watching the store itself is the only way to prove that the
    // access lives behind the port rather than beside it.
    const get = vi.spyOn(Storage.prototype, 'getItem');
    const set = vi.spyOn(Storage.prototype, 'setItem');
    const remove = vi.spyOn(Storage.prototype, 'removeItem');

    const store = new InMemoryUserStore(null);
    const us = withStore(store);
    await us.load();
    us.creditGeo(500);
    us.grantCards([goam]);
    us.purchase(100, [crawlid, crawlid]);

    expect(get).not.toHaveBeenCalled();
    expect(set).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();

    // And every behaviour is unchanged by the substitution.
    expect(us.geo()).toBe(400);
    expect(us.totalCards()).toBe(12);

    get.mockRestore();
    set.mockRestore();
    remove.mockRestore();
  });

  it('keeps the in-memory user correct when the store refuses the write', async () => {
    const us = withStore(new BrokenUserStore());

    // A rejected save must not surface as an unhandled rejection. The runner
    // reports one on the process; watching it directly is the only way to see
    // a promise nobody caught.
    const node = (globalThis as { process?: NodeLike }).process;
    const unhandled = vi.fn();
    node?.on?.('unhandledRejection', unhandled);

    us.creditGeo(500);
    expect(us.geo()).toBe(500);
    expect(us.purchase(200, [goam])).toBe(true);
    expect(us.geo()).toBe(300);
    expect(us.totalCards()).toBe(10);

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(unhandled).not.toHaveBeenCalled();
    node?.off?.('unhandledRejection', unhandled);
  });
});
