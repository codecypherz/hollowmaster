import { fitArena, MIN_CARD_WIDTH } from './arena';

/**
 * The fit is the whole reason this geometry left CSS: a `clamp()` chain can be
 * checked only by resizing a window and looking. These assertions are the
 * guarantee the screen rests on — a card is never laid out below the renderer's
 * minimum, and the arena is never asked to occupy more than the viewport gives.
 */
describe('fitArena', () => {
  describe('a viewport that can host the arena', () => {
    it('lays cards out above the minimum and applies no scale at 1920x1080', () => {
      const { unit, scale } = fitArena(1920, 1080);

      expect(unit).toBeGreaterThan(MIN_CARD_WIDTH);
      expect(scale).toBe(1);
    });

    it('grows the unit with the viewport rather than capping it', () => {
      expect(fitArena(2560, 1440).unit).toBeGreaterThan(fitArena(1920, 1080).unit);
      expect(fitArena(2560, 1440).scale).toBe(1);
    });
  });

  describe('a viewport that cannot host the arena', () => {
    it('holds the unit at the minimum and scales the arena down at 1366x768', () => {
      const { unit, scale } = fitArena(1366, 768);

      expect(unit).toBe(MIN_CARD_WIDTH);
      expect(scale).toBeLessThan(1);
      expect(scale).toBeGreaterThan(0);
    });

    it('scales further the smaller the viewport gets', () => {
      expect(fitArena(1100, 620).scale).toBeLessThan(fitArena(1366, 768).scale);
    });
  });

  describe('which dimension binds', () => {
    it('is bound by height on a wide, short viewport', () => {
      /* Halving the width changes nothing, so width is not the binding term;
         halving the height does, so height is. */
      expect(fitArena(2560, 700)).toEqual(fitArena(1280, 700));
      expect(fitArena(2560, 350).scale).toBeLessThan(fitArena(2560, 700).scale);
    });

    it('is bound by width on a narrow, tall viewport', () => {
      expect(fitArena(800, 1400)).toEqual(fitArena(800, 2000));
      expect(fitArena(400, 1400).scale).toBeLessThan(fitArena(800, 1400).scale);
    });
  });

  describe('the card minimum is absolute', () => {
    it('never lays a card out below the minimum, at any viewport size', () => {
      for (let w = 320; w <= 3840; w += 37) {
        for (let h = 240; h <= 2160; h += 41) {
          expect(fitArena(w, h).unit).toBeGreaterThanOrEqual(MIN_CARD_WIDTH);
        }
      }
    });

    it('holds the minimum at 320x240, scaling instead', () => {
      const { unit, scale } = fitArena(320, 240);

      expect(unit).toBe(MIN_CARD_WIDTH);
      expect(scale).toBeLessThan(1);
    });

    it('yields a usable scale even for a degenerate viewport', () => {
      for (const [w, h] of [
        [0, 0],
        [40, 40],
        [-100, -100],
      ]) {
        const { unit, scale } = fitArena(w, h);

        expect(unit).toBe(MIN_CARD_WIDTH);
        expect(scale).toBeGreaterThan(0);
        expect(scale).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('the arena is never asked to overflow', () => {
    it('keeps the scaled arena inside the viewport at every size', () => {
      for (let w = 320; w <= 3840; w += 53) {
        for (let h = 240; h <= 2160; h += 47) {
          const { unit, scale } = fitArena(w, h);

          /* 11 units wide by 7 units tall is the arena's extent; scaled, it
             must still sit inside the viewport with the chrome allowed for. */
          expect(11 * unit * scale).toBeLessThanOrEqual(Math.max(w - 48, 0) + 0.001);
          expect(7 * unit * scale).toBeLessThanOrEqual(Math.max(h - 48, 0) + 0.001);
        }
      }
    });
  });
});
