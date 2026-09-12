import { TestBed } from '@angular/core/testing';
import { effect } from '@angular/core';
import { UserService } from './user.service';
import { CARD_BY_KEY, Card, cardKey, cardKeyOf } from '../model/card';
import { DECK_SIZE, MAX_DECKS } from '../model/deck';
import { STARTER_CARD_KEYS, quantityOf, seedUser, totalCards } from '../model/user';

const crawlid = CARD_BY_KEY.get(cardKeyOf('FC', 1))!;
const goam = CARD_BY_KEY.get(cardKeyOf('FC', 6))!;
const gruzMother = CARD_BY_KEY.get(cardKeyOf('FC', 2))!;
/** A starter card, so a freshly seeded user holds one. */
const vengefly = CARD_BY_KEY.get(cardKeyOf('FC', 7))!;

/** Five cards to stand in for a pack. */
const pack: Card[] = [crawlid, crawlid, goam, gruzMother, crawlid];

describe('UserService', () => {
  let us: UserService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    us = TestBed.inject(UserService);
  });

  // ─── 3.1 The seeded starting state ────────────────────────────────────────

  describe('a freshly constructed service', () => {
    it('holds the seeded starter user', () => {
      expect(us.geo()).toBe(0);
      expect(us.totalCards()).toBe(9);
      expect(us.distinctCards()).toBe(9);
      for (const key of STARTER_CARD_KEYS) expect(us.collection().get(key)).toBe(1);
    });

    it('projects the same collection its state carries', () => {
      expect(us.collection()).toBe(us.state().collection);
      expect(us.geo()).toBe(us.state().geo);
    });
  });

  // ─── 3.2 Credits and grants ───────────────────────────────────────────────

  describe('creditGeo', () => {
    it('raises the balance by exactly the amount', () => {
      us.creditGeo(500);
      expect(us.geo()).toBe(500);
      us.creditGeo(500);
      expect(us.geo()).toBe(1000);
    });

    it('refuses zero, a negative amount, and a fraction', () => {
      us.creditGeo(500);
      for (const bad of [0, -1, -500, 12.5, Number.NaN]) {
        us.creditGeo(bad);
        expect(us.geo()).toBe(500);
      }
    });
  });

  describe('grantCards', () => {
    it('raises the total by the number of cards granted', () => {
      const before = us.totalCards();
      us.grantCards(pack);
      expect(us.totalCards()).toBe(before + 5);
    });

    it('raises the quantity of a card already held rather than adding a distinct one', () => {
      const distinctBefore = us.distinctCards();
      us.grantCards([crawlid]);
      expect(quantityOf(us.collection(), crawlid)).toBe(2);
      expect(us.distinctCards()).toBe(distinctBefore);
    });
  });

  // ─── 3.3 Purchase ─────────────────────────────────────────────────────────

  describe('purchase', () => {
    it('succeeds at exactly the balance and leaves nothing', () => {
      us.creditGeo(100);
      expect(us.purchase(100, pack)).toBe(true);
      expect(us.geo()).toBe(0);
      expect(us.totalCards()).toBe(14);
    });

    it('deducts exactly the price when the balance is larger', () => {
      us.creditGeo(250);
      expect(us.purchase(100, pack)).toBe(true);
      expect(us.geo()).toBe(150);
    });

    it('changes neither balance nor collection when one Geo short', () => {
      us.creditGeo(99);
      const collection = us.collection();
      expect(us.purchase(100, pack)).toBe(false);
      expect(us.geo()).toBe(99);
      expect(us.collection()).toBe(collection);
      expect(us.totalCards()).toBe(9);
    });

    it('publishes one emission per purchase, never the deduction on its own', () => {
      const seen: { geo: number; total: number }[] = [];
      TestBed.runInInjectionContext(() => {
        effect(() => {
          const s = us.state();
          seen.push({ geo: s.geo, total: totalCards(s.collection) });
        });
      });
      TestBed.tick();
      expect(seen).toHaveLength(1);

      us.creditGeo(300);
      TestBed.tick();
      expect(seen).toHaveLength(2);

      us.purchase(100, pack);
      TestBed.tick();

      // One further emission, and it carries both sides of the purchase: the
      // Geo gone and the cards arrived.
      expect(seen).toHaveLength(3);
      expect(seen[2]).toEqual({ geo: 200, total: 14 });

      // No emission anywhere in the record shows one side without the other.
      for (const s of seen) expect(s.geo + s.total).not.toBe(200 + 9);
    });
  });

  // ─── 3.4 The balance floor ────────────────────────────────────────────────

  describe('the balance', () => {
    it('exposes no way to spend Geo without granting cards', () => {
      expect((us as unknown as Record<string, unknown>)['spendGeo']).toBeUndefined();
      const surface = [
        ...Object.getOwnPropertyNames(Object.getPrototypeOf(us)),
        ...Object.getOwnPropertyNames(us),
      ];
      expect(surface).not.toContain('spendGeo');
      expect(surface.filter((n) => /spend|debit|deduct|withdraw/i.test(n))).toEqual([]);
    });

    it('is never negative across an arbitrary sequence of credits and purchases', () => {
      const amounts = [500, 1, 250, 100, 7, 1000];
      const prices = [100, 250, 500, 1, 99, 10_000];
      for (let i = 0; i < 200; i++) {
        if (i % 3 === 0) us.creditGeo(amounts[i % amounts.length]);
        else us.purchase(prices[i % prices.length], pack);
        expect(us.geo()).toBeGreaterThanOrEqual(0);
        expect(Number.isInteger(us.geo())).toBe(true);
      }
    });

    it('refuses a negative or fractional price outright', () => {
      us.creditGeo(500);
      for (const bad of [-1, -100, 0.5]) {
        expect(us.purchase(bad, pack)).toBe(false);
      }
      expect(us.geo()).toBe(500);
      expect(us.totalCards()).toBe(9);
    });
  });

  // ─── 5.1 / 5.2 / 5.3 The deck commands ────────────────────────────────────

  describe('the deck commands', () => {
    it('exposes the one seeded empty deck', () => {
      expect(us.decks()).toHaveLength(1);
      expect(us.decks()[0].cards).toEqual([]);
      expect(us.decks()).toBe(us.state().decks);
    });

    it('creates a deck and refuses the tenth', () => {
      for (let i = 1; i < MAX_DECKS; i++) expect(us.createDeck()).toBe(true);
      expect(us.decks()).toHaveLength(MAX_DECKS);
      expect(us.createDeck()).toBe(false);
      expect(us.decks()).toHaveLength(MAX_DECKS);
    });

    it('adds a held card and refuses one the collection does not hold', () => {
      expect(us.addCardToDeck(0, crawlid)).toBe(true);
      expect(us.decks()[0].cards).toEqual([cardKey(crawlid)]);
      expect(us.addCardToDeck(0, goam)).toBe(false);
      expect(us.decks()[0].cards).toEqual([cardKey(crawlid)]);
    });

    it('fills a deck from one held copy and refuses the tenth card', () => {
      for (let i = 0; i < DECK_SIZE; i++) expect(us.addCardToDeck(0, crawlid)).toBe(true);
      expect(us.decks()[0].cards).toHaveLength(DECK_SIZE);
      expect(us.addCardToDeck(0, crawlid)).toBe(false);
      expect(quantityOf(us.collection(), crawlid)).toBe(1);
    });

    it('removes the card at a position and refuses one no card occupies', () => {
      us.addCardToDeck(0, crawlid);
      us.addCardToDeck(0, vengefly);
      us.addCardToDeck(0, crawlid);

      expect(us.removeCardFromDeck(0, 1)).toBe(true);
      expect(us.decks()[0].cards).toEqual([cardKey(crawlid), cardKey(crawlid)]);
      expect(us.removeCardFromDeck(0, 5)).toBe(false);
    });

    it('deletes a deck and refuses an index no deck occupies', () => {
      us.createDeck();
      expect(us.deleteDeck(0)).toBe(true);
      expect(us.decks()).toHaveLength(1);
      expect(us.deleteDeck(3)).toBe(false);
    });

    it('emits from the decks signal after every successful command', () => {
      const seen: number[] = [];
      TestBed.runInInjectionContext(() => {
        effect(() => seen.push(us.decks().length));
      });
      TestBed.tick();

      us.createDeck();
      TestBed.tick();
      us.deleteDeck(1);
      TestBed.tick();

      expect(seen).toEqual([1, 2, 1]);
    });

    it('never changes the collection or the balance', () => {
      us.creditGeo(500);

      const geoSeen: number[] = [];
      const collectionSeen: unknown[] = [];
      TestBed.runInInjectionContext(() => {
        effect(() => geoSeen.push(us.geo()));
        effect(() => collectionSeen.push(us.collection()));
      });
      TestBed.tick();

      us.createDeck();
      us.addCardToDeck(0, crawlid);
      us.addCardToDeck(1, crawlid);
      us.removeCardFromDeck(0, 0);
      us.deleteDeck(1);
      us.addCardToDeck(0, goam); // refused
      TestBed.tick();

      expect(geoSeen).toEqual([500]);
      expect(collectionSeen).toHaveLength(1);
      expect(us.geo()).toBe(500);
      expect(us.totalCards()).toBe(9);
    });
  });

  // ─── The single user ──────────────────────────────────────────────────────

  it('reads as one user from every injection point', () => {
    const other = TestBed.inject(UserService);
    expect(other).toBe(us);
    us.creditGeo(42);
    expect(other.geo()).toBe(42);
  });

  it('starts from a state equal to a fresh seed', () => {
    expect(us.state().geo).toBe(seedUser().geo);
    expect([...us.state().collection.entries()].sort()).toEqual(
      [...seedUser().collection.entries()].sort(),
    );
  });
});
