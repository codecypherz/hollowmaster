import { TestBed } from '@angular/core/testing';
import { addSixStarCard } from '../testing/six-star';
import { CARD_BY_KEY, cardKeyOf } from '../model/card';
import { NO_MILESTONES, PersistedUser, SCHEMA_VERSION, quantityOf } from '../model/user';
import { CartService } from './cart.service';
import { USER_STORE, UserStore } from './user-store';
import { UserService } from './user.service';

const crawlid = CARD_BY_KEY.get(cardKeyOf('FC', 1))!; // one star
const vengefly = CARD_BY_KEY.get(cardKeyOf('FC', 3))!; // one star
const aspidMother = CARD_BY_KEY.get(cardKeyOf('FC', 8))!; // two stars
const gruzMother = CARD_BY_KEY.get(cardKeyOf('FC', 6))!; // three stars

class RecordingStore implements UserStore {
  saved: PersistedUser[] = [];
  constructor(private readonly record: Partial<PersistedUser>) {}
  async load(): Promise<PersistedUser> {
    return {
      version: SCHEMA_VERSION,
      geo: 0,
      rosaries: 0,
      collection: [],
      decks: [],
      battleDeck: null,
      milestones: NO_MILESTONES,
      ...this.record,
    };
  }
  async save(user: PersistedUser): Promise<void> {
    this.saved.push(user);
  }
}

const held = (number: number, quantity: number) => ({ set: 'FC', number, quantity });
const ref = (number: number) => ({ set: 'FC', number });

describe('CartService', () => {
  let store: RecordingStore;
  let users: UserService;
  let cart: CartService;

  async function start(record: Partial<PersistedUser> = {}): Promise<void> {
    store = new RecordingStore(record);
    TestBed.configureTestingModule({ providers: [{ provide: USER_STORE, useValue: store }] });
    users = TestBed.inject(UserService);
    cart = TestBed.inject(CartService);
    await users.load();
  }

  it('starts empty', async () => {
    await start();
    expect(cart.lines()).toEqual([]);
    expect(cart.isEmpty()).toBe(true);
    expect(cart.count()).toBe(0);
    expect(cart.net()).toBe(0);
    expect(cart.canConfirm()).toBe(false);
  });

  it('counts copies across lines and signs each effect', async () => {
    await start({ rosaries: 0, collection: [held(8, 3)] });
    cart.setQuantity(aspidMother, 'sell', 3);
    cart.setQuantity(crawlid, 'buy', 3);
    expect(cart.count()).toBe(6);
    expect(cart.rows().map((row) => [row.card.name, row.effect])).toEqual([
      ['Aspid Mother', 9],
      ['Crawlid', -12],
    ]);
    expect(cart.net()).toBe(-3);
    expect(cart.balanceAfter()).toBe(-3);
    expect(cart.shortfall()).toBe(3);
    expect(cart.canConfirm()).toBe(false);
  });

  it('can be confirmed for a gain, for exactly the balance, and for a net of zero', async () => {
    await start({ rosaries: 4, collection: [held(1, 10)] });
    cart.setQuantity(crawlid, 'sell', 6);
    expect(cart.balanceAfter()).toBe(10);
    expect(cart.canConfirm()).toBe(true);

    cart.setQuantity(crawlid, 'sell', 4);
    cart.setQuantity(vengefly, 'buy', 1);
    expect(cart.net()).toBe(0);
    expect(cart.canConfirm()).toBe(true);

    cart.setQuantity(vengefly, 'buy', 2);
    expect(cart.net()).toBe(-4);
    expect(cart.balanceAfter()).toBe(0);
    expect(cart.shortfall()).toBe(0);
    expect(cart.canConfirm()).toBe(true);

    cart.setQuantity(crawlid, 'sell', 3);
    expect(cart.shortfall()).toBe(1);
    expect(cart.canConfirm()).toBe(false);
  });

  it('reports what each change did', async () => {
    await start({ collection: [held(1, 2)] });
    expect(cart.setQuantity(crawlid, 'buy', 3)).toEqual({
      card: crawlid,
      action: 'buy',
      quantity: 3,
      cleared: false,
    });
    expect(cart.setQuantity(crawlid, 'sell', 5)).toEqual({
      card: crawlid,
      action: 'sell',
      quantity: 2,
      cleared: true,
    });
    expect(cart.quantityFor(crawlid, 'buy')).toBe(0);
  });

  it('names the decks a pending sale would trim, following its quantity', async () => {
    await start({ collection: [held(1, 3)], decks: [[ref(1), ref(1)]] });
    cart.setQuantity(crawlid, 'sell', 1);
    expect(cart.rows()[0].trims).toEqual([]);
    cart.setQuantity(crawlid, 'sell', 2);
    expect(cart.rows()[0].trims).toEqual(['Deck 1']);
    cart.setQuantity(crawlid, 'buy', 2);
    expect(cart.rows()[0].trims).toEqual([]);
  });

  it('changes no user state and writes nothing while pending', async () => {
    await start({ rosaries: 500, collection: [held(1, 1)], decks: [[ref(1)]] });
    const before = users.state();
    store.saved = [];
    cart.setQuantity(crawlid, 'sell', 1);
    cart.setQuantity(vengefly, 'buy', 4);
    cart.remove(vengefly);
    expect(users.state()).toBe(before);
    expect(store.saved).toEqual([]);
  });

  it('reduces a sale when the copies held fall, and drops it at none', async () => {
    await start({ collection: [held(1, 3), held(3, 1)] });
    cart.setQuantity(crawlid, 'sell', 3);
    cart.setQuantity(vengefly, 'sell', 1);
    cart.setQuantity(gruzMother, 'buy', 1);
    users.reset(); // one of each starter, so one Crawlid and one Vengefly
    expect(cart.lines().map((line) => [line.key, line.quantity])).toEqual([
      ['FC#1', 1],
      ['FC#3', 1],
      ['FC#6', 1],
    ]);
    users.settle([{ key: 'FC#3', action: 'sell', quantity: 1 }]);
    expect(cart.lines().map((line) => line.key)).toEqual(['FC#1', 'FC#6']);
    expect(cart.count()).toBe(2);
  });

  it('removes a line and clears them all', async () => {
    await start({ collection: [held(1, 1)] });
    cart.setQuantity(crawlid, 'sell', 1);
    cart.setQuantity(vengefly, 'buy', 1);
    cart.remove(crawlid);
    expect(cart.lines().map((line) => line.key)).toEqual(['FC#3']);
    cart.clear();
    expect(cart.isEmpty()).toBe(true);
  });

  it('confirms the whole cart in one write, empties it, and says what it did', async () => {
    await start({
      rosaries: 50,
      collection: [held(1, 6), held(8, 1)],
      decks: [[], [ref(8)], [ref(1), ref(1)]],
    });
    store.saved = [];
    cart.setQuantity(crawlid, 'sell', 6);
    cart.setQuantity(aspidMother, 'sell', 1);
    cart.setQuantity(vengefly, 'buy', 1);

    expect(cart.confirm()).toEqual({
      sold: 7,
      bought: 1,
      net: 5,
      trims: ['Deck 2', 'Deck 3'],
    });
    expect(users.rosaries()).toBe(55);
    expect(quantityOf(users.collection(), crawlid)).toBe(0);
    expect(quantityOf(users.collection(), vengefly)).toBe(1);
    expect(users.decks().every((deck) => deck.cards.length === 0)).toBe(true);
    expect(store.saved).toHaveLength(1);
    expect(cart.isEmpty()).toBe(true);
  });

  it('keeps its lines when it cannot be confirmed', async () => {
    await start({ rosaries: 3 });
    store.saved = [];
    cart.setQuantity(crawlid, 'buy', 1);
    const lines = cart.lines();
    expect(cart.confirm()).toBeNull();
    expect(cart.lines()).toEqual(lines);
    expect(users.rosaries()).toBe(3);
    expect(store.saved).toEqual([]);
  });

  it('keeps its lines when settling refuses', async () => {
    await start({ rosaries: 500 });
    cart.setQuantity(crawlid, 'buy', 1);
    users.settle = () => false;
    expect(cart.confirm()).toBeNull();
    expect(cart.count()).toBe(1);
  });

  it('adds no line for a purchase whose rate is unknown, until it is known', async () => {
    const six = addSixStarCard();
    await start({ rosaries: 9998 });
    expect(cart.setQuantity(six, 'buy', 2).quantity).toBe(0);
    expect(cart.isEmpty()).toBe(true);

    users.grantCards([crawlid]);
    users.settle([{ key: 'FC#1', action: 'sell', quantity: 1 }]);
    expect(users.rosaries()).toBe(9999);
    expect(cart.setQuantity(six, 'buy', 2).quantity).toBe(2);
    expect(cart.rows()[0]).toMatchObject({ rateKnown: true, max: 99, effect: -19998 });
  });
});
