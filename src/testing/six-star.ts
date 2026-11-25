import { onTestFinished } from 'vitest';
import { CARD_BY_KEY, CARD_DB, Card, cardKey } from '../model/card';

/**
 * Catalogues a six-star card for the running test alone: no real card has six
 * stars yet, so the rules that only such a card reaches have nothing to run on.
 * Call it from a test or a `beforeEach`; the card is taken out when that test
 * ends, whatever its outcome.
 */
export function addSixStarCard(): Card {
  const card = new Card({
    name: 'Test Radiance',
    arrows: ['N'],
    stars: 6,
    image: 'crawlid.webp',
    attack: 99,
    defense: 99,
    ability: 'Exists only while a test runs.',
    set: 'FC',
    number: 900,
  });
  const key = cardKey(card);
  // Typed read-only everywhere else, and a plain `Map` underneath.
  const byKey = CARD_BY_KEY as Map<typeof key, Card>;

  onTestFinished(() => {
    CARD_DB.splice(CARD_DB.indexOf(card), 1);
    byKey.delete(key);
  });
  CARD_DB.push(card);
  byKey.set(key, card);
  return card;
}
