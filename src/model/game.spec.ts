import { CARD_BY_KEY, cardKeyOf } from './card';
import { decideFirstTurn, starTotal } from './game';

describe('star totals', () => {
  it('sums the rarity stars of the cards held, ignoring empty slots', () => {
    const crawlid = CARD_BY_KEY.get(cardKeyOf('FC', 1))!; // one star
    const gruzMother = CARD_BY_KEY.get(cardKeyOf('FC', 6))!; // three stars
    expect(starTotal([crawlid, gruzMother, null, crawlid])).toBe(5);
    expect(starTotal([])).toBe(0);
  });
});

describe('who moves first', () => {
  const never = () => {
    throw new Error('no coin should be flipped when the totals differ');
  };

  it('sends the heavier deck first', () => {
    expect(decideFirstTurn(12, 9, never)).toEqual({
      first: 'player',
      playerStars: 12,
      opponentStars: 9,
      coinFlip: false,
    });
  });

  it('sends the lighter deck second', () => {
    expect(decideFirstTurn(9, 12, never)).toMatchObject({ first: 'opponent', coinFlip: false });
  });

  it('follows the coin on a tie', () => {
    expect(decideFirstTurn(9, 9, () => 0.1)).toMatchObject({ first: 'player', coinFlip: true });
    expect(decideFirstTurn(9, 9, () => 0.9)).toMatchObject({ first: 'opponent', coinFlip: true });
  });

  it('favours neither side on a tie under Math.random', () => {
    let player = 0;
    const runs = 2000;
    for (let i = 0; i < runs; i++)
      if (decideFirstTurn(9, 9, Math.random).first === 'player') player++;
    expect(player).toBeGreaterThan(runs * 0.4);
    expect(player).toBeLessThan(runs * 0.6);
  });
});
