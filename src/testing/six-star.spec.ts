import { CARD_BY_KEY, CARD_DB, cardKey } from '../model/card';
import { addSixStarCard } from './six-star';

describe('addSixStarCard', () => {
  const catalogue = [...CARD_DB];
  const keys = [...CARD_BY_KEY.keys()];

  it('catalogues a six-star card', () => {
    const card = addSixStarCard();
    expect(card.stars).toBe(6);
    expect(CARD_DB).toContain(card);
    expect(CARD_BY_KEY.get(cardKey(card))).toBe(card);
  });

  it('leaves the catalogue as it was once that test has finished', () => {
    expect(CARD_DB).toEqual(catalogue);
    expect([...CARD_BY_KEY.keys()]).toEqual(keys);
  });
});
