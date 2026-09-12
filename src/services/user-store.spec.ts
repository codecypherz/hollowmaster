import { TestBed } from '@angular/core/testing';
import { LocalStorageUserStore, STORAGE_KEY, USER_STORE, UserStore } from './user-store';
import { UserService } from './user.service';
import { CARD_BY_KEY, cardKeyOf } from '../model/card';
import {
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
      collection: grantAll(seedUser().collection, [crawlid, crawlid, goam]),
    };
    const restored = fromPersisted(
      parsePersistedUser(JSON.parse(JSON.stringify(toPersisted(original))))!,
    );

    expect(restored.geo).toBe(350);
    expect(totalCards(restored.collection)).toBe(totalCards(original.collection));
    expect(distinctCards(restored.collection)).toBe(distinctCards(original.collection));
    expect([...restored.collection.entries()].sort()).toEqual(
      [...original.collection.entries()].sort(),
    );
  });

  it('states a set, a number, and a quantity, and nothing else about a card', () => {
    const persisted = toPersisted({ geo: 12, collection: grantAll(new Map(), [goam, goam]) });
    expect(persisted).toEqual({
      version: SCHEMA_VERSION,
      geo: 12,
      collection: [{ set: 'FC', number: 6, quantity: 2 }],
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
    const persisted = toPersisted({ geo: 0, collection: new Map([[cardKeyOf('FC', 6), 3]]) });
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
    collection: [{ set: 'FC', number: 1, quantity: 2 }],
  });

  it('accepts a well-formed record', () => {
    expect(parsePersistedUser(valid())).toEqual({
      version: SCHEMA_VERSION,
      geo: 100,
      collection: [{ set: 'FC', number: 1, quantity: 2 }],
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
  });

  it('restores five known cards and the full balance when one card is unknown', () => {
    const parsed = parsePersistedUser({
      version: SCHEMA_VERSION,
      geo: 777,
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

// ─── 4.4 The localStorage implementation ────────────────────────────────────

describe('LocalStorageUserStore', () => {
  const store = new LocalStorageUserStore();

  afterEach(() => {
    localStorage.clear();
  });

  it('round-trips through one named key', async () => {
    await store.save(toPersisted({ geo: 25, collection: grantAll(new Map(), [goam]) }));
    expect(localStorage.getItem(STORAGE_KEY)).toBeTruthy();
    expect(Object.keys(localStorage)).toEqual([STORAGE_KEY]);
    expect(await store.load()).toEqual({
      version: SCHEMA_VERSION,
      geo: 25,
      collection: [{ set: 'FC', number: 6, quantity: 1 }],
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
        collection: [{ set: 'FC', number: 6, quantity: 2 }],
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
