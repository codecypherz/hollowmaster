import { CARD_BY_KEY, cardKey, cardKeyOf } from './card';
import {
  CartLine,
  MAX_PENDING_BUY,
  changeText,
  maxPending,
  quantityFor,
  raiseRefusal,
  remove,
  setQuantity,
  withinHeld,
} from './cart';

const crawlid = CARD_BY_KEY.get(cardKeyOf('FC', 1))!;
const c = cardKey(crawlid);
const v = cardKeyOf('FC', 7);
const g = cardKeyOf('FC', 8);

const buying = (quantity: number, key = c): CartLine => ({ key, action: 'buy', quantity });
const selling = (quantity: number, key = c): CartLine => ({ key, action: 'sell', quantity });

describe('setting a pending quantity', () => {
  it('adds a line for a card with nothing pending', () => {
    expect(setQuantity([], c, 'buy', 2, 0)).toEqual([buying(2)]);
  });

  it('replaces the line in place when the direction changes', () => {
    const lines = [buying(3), buying(1, v)];
    const next = setQuantity(lines, c, 'sell', 1, 5);
    expect(next).toEqual([selling(1), buying(1, v)]);
    expect(quantityFor(next, c, 'buy')).toBe(0);
    expect(quantityFor(next, c, 'sell')).toBe(1);
  });

  it('takes the line out at zero', () => {
    expect(setQuantity([buying(1), selling(1, v)], c, 'buy', 0, 0)).toEqual([selling(1, v)]);
    expect(setQuantity([buying(1)], c, 'buy', -1, 0)).toEqual([]);
  });

  it('does not clear the other direction when this one is set to zero', () => {
    expect(setQuantity([buying(3)], c, 'sell', 0, 5)).toEqual([buying(3)]);
    // Including when the zero comes from the bound: nothing held to sell.
    expect(setQuantity([buying(3)], c, 'sell', 1, 0)).toEqual([buying(3)]);
  });

  it('clamps a sale to the copies held', () => {
    expect(setQuantity([selling(2)], c, 'sell', 3, 2)).toEqual([selling(2)]);
  });

  it('clamps a purchase to its bound', () => {
    expect(MAX_PENDING_BUY).toBe(99);
    expect(setQuantity([buying(99)], c, 'buy', 100, 0)).toEqual([buying(99)]);
  });

  it('keeps the order cards were first added in', () => {
    let lines: readonly CartLine[] = [];
    lines = setQuantity(lines, g, 'buy', 1, 0);
    lines = setQuantity(lines, c, 'sell', 1, 4);
    lines = setQuantity(lines, v, 'buy', 1, 0);
    lines = setQuantity(lines, g, 'buy', 5, 0);
    lines = setQuantity(lines, c, 'buy', 2, 4);
    expect(lines.map((line) => line.key)).toEqual([g, c, v]);
  });
});

describe('removing a line', () => {
  it('takes that card out and leaves the rest', () => {
    expect(remove([buying(1), selling(2, v)], c)).toEqual([selling(2, v)]);
    expect(remove([buying(1)], v)).toEqual([buying(1)]);
  });
});

describe('copies held falling', () => {
  it('reduces a sale, drops one left at none, and leaves purchases alone', () => {
    const held = new Map([[c, 1]]);
    const lines = [selling(3), selling(2, v), buying(4, g)];
    expect(withinHeld(lines, (key) => held.get(key) ?? 0)).toEqual([selling(1), buying(4, g)]);
  });
});

describe('bounds', () => {
  it('are the copies held for a sale and 99 for a purchase', () => {
    expect(maxPending('sell', 4)).toBe(4);
    expect(maxPending('buy', 4)).toBe(99);
  });

  it('give a reason exactly when one more is refused', () => {
    expect(raiseRefusal('sell', 2, 1)).toBe('');
    expect(raiseRefusal('sell', 2, 2)).toBe('Every copy you hold is pending');
    expect(raiseRefusal('sell', 0, 0)).toBe('You hold none to sell');
    expect(raiseRefusal('buy', 0, 98)).toBe('');
    expect(raiseRefusal('buy', 0, 99)).toBe('99 is the most that can be pending');
  });
});

describe('the text of a change', () => {
  const base = { card: crawlid, action: 'sell', quantity: 2, cleared: false } as const;

  it('names the card, the direction, and the new quantity', () => {
    expect(changeText(base)).toBe('2 Crawlid pending for sale.');
    expect(changeText({ ...base, action: 'buy', quantity: 0 })).toBe(
      '0 Crawlid pending for purchase.',
    );
  });

  it('says when the other direction was cleared', () => {
    expect(changeText({ ...base, cleared: true })).toBe(
      '2 Crawlid pending for sale. Its pending purchase was cleared.',
    );
    expect(changeText({ ...base, action: 'buy', cleared: true })).toBe(
      '2 Crawlid pending for purchase. Its pending sale was cleared.',
    );
  });
});
