import { Card, CardOptions, CARD_DB, DIRECTIONS, Direction } from './card';

/**
 * The model is the boundary where card values are checked, so every consumer
 * downstream can read a card without defending itself. These tests hold that
 * boundary: what a valid card accepts, what an invalid one is rejected for,
 * and that the shipped catalogue satisfies both.
 */
describe('Card', () => {
  const base: CardOptions = {
    name: 'Crawlid',
    arrows: ['N'],
    stars: 1,
    image: 'crawlid.webp',
    attack: 5,
    defense: 5,
    ability: 'Trundles the crossroads floor without malice.',
    set: 'Forgotten Crossroads',
    number: 1,
  };

  const card = (overrides: Partial<CardOptions> = {}) => new Card({ ...base, ...overrides });

  describe('construction', () => {
    it('resolves the artwork filename under /images/', () => {
      expect(card({ image: 'goam.webp' }).image).toBe('/images/goam.webp');
    });

    it('does not share an arrows array between cards built from the same options', () => {
      const options = { ...base, arrows: ['N', 'E'] as Direction[] };
      const a = new Card(options);
      const b = new Card(options);
      expect(a.arrows).not.toBe(b.arrows);
      expect(a.arrows).not.toBe(options.arrows);
      expect(Object.isFrozen(a.arrows)).toBe(true);
      expect(() => (a.arrows as Direction[]).push('S')).toThrow();
      expect(a.arrows).toEqual(['N', 'E']);
    });

    it('states every property without deriving one from another', () => {
      const weak = card({ stars: 4, attack: 1, defense: 100 });
      expect(weak.stars).toBe(4);
      expect(weak.attack).toBe(1);
      expect(weak.defense).toBe(100);
    });
  });

  describe('accepted boundaries', () => {
    it('accepts a star rating of 1 and of 6', () => {
      expect(card({ stars: 1 }).stars).toBe(1);
      expect(card({ stars: 6 }).stars).toBe(6);
    });

    it('accepts an attack of 1 and of 100', () => {
      expect(card({ attack: 1 }).attack).toBe(1);
      expect(card({ attack: 100 }).attack).toBe(100);
    });

    it('accepts a defense of 1 and of 100', () => {
      expect(card({ defense: 1 }).defense).toBe(1);
      expect(card({ defense: 100 }).defense).toBe(100);
    });

    it('accepts a set number of 1', () => {
      expect(card({ number: 1 }).number).toBe(1);
    });

    it('accepts every one of the eight directions', () => {
      expect(card({ arrows: [...DIRECTIONS] }).arrows).toEqual(DIRECTIONS);
    });

    it('accepts a card with no arrows at all', () => {
      expect(card({ arrows: [] }).arrows).toEqual([]);
    });
  });

  describe('rejected values', () => {
    const rejects = (label: string, overrides: Partial<CardOptions>, field: string) =>
      it(label, () => {
        expect(() => card(overrides)).toThrow(TypeError);
        expect(() => card(overrides)).toThrow(new RegExp(field));
      });

    rejects('rejects a star rating of 0', { stars: 0 }, 'stars');
    rejects('rejects a star rating of 7', { stars: 7 }, 'stars');
    rejects('rejects a fractional star rating', { stars: 2.5 }, 'stars');
    rejects('rejects an attack of 0', { attack: 0 }, 'attack');
    rejects('rejects an attack of 101', { attack: 101 }, 'attack');
    rejects('rejects a fractional attack', { attack: 33.3 }, 'attack');
    rejects('rejects a defense of 0', { defense: 0 }, 'defense');
    rejects('rejects a defense of 101', { defense: 101 }, 'defense');
    rejects('rejects a fractional defense', { defense: 12.5 }, 'defense');
    rejects('rejects a set number of 0', { number: 0 }, 'number');
    rejects('rejects a negative set number', { number: -3 }, 'number');
    rejects('rejects a fractional set number', { number: 1.5 }, 'number');
    rejects('rejects an empty name', { name: '' }, 'name');
    rejects('rejects a whitespace-only name', { name: '   ' }, 'name');
    rejects('rejects an empty image', { image: '' }, 'image');
    rejects('rejects a whitespace-only image', { image: '  ' }, 'image');
    rejects('rejects empty ability text', { ability: '' }, 'ability');
    rejects('rejects whitespace-only ability text', { ability: ' \n ' }, 'ability');
    rejects('rejects an empty set', { set: '' }, 'set');
    rejects('rejects a whitespace-only set', { set: '  ' }, 'set');
    rejects(
      'rejects a direction outside the eight',
      { arrows: ['NNE' as Direction] },
      'unknown direction',
    );
    rejects('rejects a repeated direction', { arrows: ['N', 'E', 'N'] }, 'repeats the direction');
  });

  describe('arrows', () => {
    it('reports the directions it possesses and only those', () => {
      const c = card({ arrows: ['N', 'SE', 'W'] });
      expect(DIRECTIONS.filter((d) => c.hasArrow(d))).toEqual(['N', 'SE', 'W']);
      expect(DIRECTIONS.filter((d) => !c.hasArrow(d))).toEqual(['NE', 'E', 'S', 'SW', 'NW']);
    });

    it('reports all eight when it possesses all eight', () => {
      const c = card({ arrows: [...DIRECTIONS] });
      expect(DIRECTIONS.every((d) => c.hasArrow(d))).toBe(true);
    });

    it('reports none when it possesses none', () => {
      const c = card({ arrows: [] });
      expect(DIRECTIONS.some((d) => c.hasArrow(d))).toBe(false);
    });
  });

  describe('collection identity', () => {
    it('reports its own set and number', () => {
      const c = card({ set: 'Greenpath', number: 4 });
      expect(c.set).toBe('Greenpath');
      expect(c.number).toBe(4);
    });

    it('allows the same number in two different sets', () => {
      expect(() => card({ set: 'Forgotten Crossroads', number: 4 })).not.toThrow();
      expect(() => card({ set: 'Greenpath', number: 4 })).not.toThrow();
    });
  });
});

describe('CARD_DB', () => {
  it('is not empty', () => {
    expect(CARD_DB.length).toBeGreaterThan(0);
  });

  it('gives every card non-empty name, image, ability, and set', () => {
    for (const c of CARD_DB) {
      expect(c.name.trim()).not.toBe('');
      expect(c.image).toMatch(/^\/images\/.+/);
      expect(c.ability.trim()).not.toBe('');
      expect(c.set.trim()).not.toBe('');
    }
  });

  it('keeps every card within the model ranges', () => {
    for (const c of CARD_DB) {
      expect(Number.isInteger(c.stars)).toBe(true);
      expect(c.stars).toBeGreaterThanOrEqual(1);
      expect(c.stars).toBeLessThanOrEqual(6);
      expect(Number.isInteger(c.attack)).toBe(true);
      expect(c.attack).toBeGreaterThanOrEqual(1);
      expect(c.attack).toBeLessThanOrEqual(100);
      expect(Number.isInteger(c.defense)).toBe(true);
      expect(c.defense).toBeGreaterThanOrEqual(1);
      expect(c.defense).toBeLessThanOrEqual(100);
      expect(Number.isInteger(c.number)).toBe(true);
      expect(c.number).toBeGreaterThanOrEqual(1);
    }
  });

  it('gives every card a duplicate-free arrow set', () => {
    for (const c of CARD_DB) {
      expect(new Set(c.arrows).size).toBe(c.arrows.length);
      for (const dir of c.arrows) expect(DIRECTIONS).toContain(dir);
    }
  });

  it('never repeats a number within a set', () => {
    const keys = CARD_DB.map((c) => `${c.set}#${c.number}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
