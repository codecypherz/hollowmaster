import { TestBed } from '@angular/core/testing';
import { Card, CARD_BY_KEY, cardKeyOf } from '../../model/card';
import { PACK_SIZE, revealOrder } from '../../model/pack';
import { PackOpening, OPENING_SIZE, dwellFor, fitOverlay } from './pack-opening';

const crawlid = CARD_BY_KEY.get(cardKeyOf('FC', 1))!; // ★1
const huskWarrior = CARD_BY_KEY.get(cardKeyOf('FC', 15))!; // ★2
const gruzMother = CARD_BY_KEY.get(cardKeyOf('FC', 2))!; // ★3
const goam = CARD_BY_KEY.get(cardKeyOf('FC', 6))!; // ★4

/** A pack already in reveal order: common first, rarest last. */
const pack: Card[] = revealOrder([goam, crawlid, gruzMother, crawlid, huskWarrior]);

function mount(cards: readonly Card[] = pack) {
  const fixture = TestBed.createComponent(PackOpening);
  fixture.componentRef.setInput('cards', cards);
  fixture.detectChanges();
  return fixture;
}

describe('PackOpening', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /** Runs the whole timer chain out. */
  function runSequence(fixture: ReturnType<typeof mount>) {
    for (let i = 0; i < OPENING_SIZE + 1; i++) {
      vi.runOnlyPendingTimers();
      fixture.detectChanges();
    }
  }

  // ─── 6.1 The cards it renders ───────────────────────────────────────────

  it('renders a card face for every card it is handed', () => {
    const fixture = mount();
    const row = fixture.nativeElement.querySelectorAll('.collected app-card');
    expect(row).toHaveLength(PACK_SIZE);
    expect(fixture.componentInstance.cards()).toHaveLength(5);
  });

  it('opens with the first card in the hero slot and none collected', () => {
    const fixture = mount();
    expect(fixture.componentInstance.hero()).toBe(pack[0]);
    expect(fixture.componentInstance.revealed()).toBe(0);
    expect(fixture.nativeElement.querySelectorAll('.collected-card.is-revealed')).toHaveLength(0);
  });

  // ─── 6.3 The sequence ───────────────────────────────────────────────────

  it('collects the cards one at a time, in the order it was given them', () => {
    const fixture = mount();
    const seen: (Card | null)[] = [];

    for (let i = 0; i < OPENING_SIZE; i++) {
      seen.push(fixture.componentInstance.hero());
      expect(fixture.componentInstance.revealed()).toBe(i);
      expect(fixture.nativeElement.querySelectorAll('.collected-card.is-revealed')).toHaveLength(i);
      vi.runOnlyPendingTimers();
      fixture.detectChanges();
    }

    expect(seen).toEqual(pack);
    expect(fixture.componentInstance.isComplete()).toBe(true);
    expect(fixture.componentInstance.hero()).toBeNull();
  });

  it('reveals its cards in ascending rarity when given a pack in reveal order', () => {
    const fixture = mount();
    const rarities: number[] = [];
    for (let i = 0; i < OPENING_SIZE; i++) {
      rarities.push(fixture.componentInstance.hero()!.stars);
      vi.runOnlyPendingTimers();
      fixture.detectChanges();
    }
    for (let i = 1; i < rarities.length; i++) {
      expect(rarities[i]).toBeGreaterThanOrEqual(rarities[i - 1]);
    }
  });

  // ─── 6.4 Dwell scales with rarity ───────────────────────────────────────

  describe('dwell time', () => {
    it('holds a rarer card longer than a common one', () => {
      expect(dwellFor(goam)).toBeGreaterThan(dwellFor(gruzMother));
      expect(dwellFor(gruzMother)).toBeGreaterThan(dwellFor(huskWarrior));
      expect(dwellFor(huskWarrior)).toBeGreaterThan(dwellFor(crawlid));
    });

    it('is a positive length of time for every rarity', () => {
      for (const card of CARD_BY_KEY.values()) expect(dwellFor(card)).toBeGreaterThan(0);
    });
  });

  // ─── 6.5 Rarity emphasis is a class, not an animation ───────────────────

  it('keys each card wrapper on the card rarity', () => {
    const fixture = mount();
    runSequence(fixture);

    const wrappers = [...fixture.nativeElement.querySelectorAll('.collected-card')];
    expect(wrappers).toHaveLength(PACK_SIZE);
    wrappers.forEach((el: Element, i: number) => {
      expect(el.classList.contains(`rarity-${pack[i].stars}`)).toBe(true);
      expect(el.getAttribute('data-stars')).toBe(String(pack[i].stars));
    });
  });

  it('states each card rarity as text as well as a class', () => {
    const fixture = mount();
    runSequence(fixture);
    const labels = [...fixture.nativeElement.querySelectorAll('.collected .rarity-label')].map(
      (el: Element) => el.textContent!.trim(),
    );
    expect(labels).toEqual(pack.map((c) => `${c.stars}-star`));
  });

  // ─── 6.6 Skip, and the one way to end ───────────────────────────────────

  it('shows every card immediately when skipped partway, in the same order', () => {
    const fixture = mount();
    vi.runOnlyPendingTimers();
    fixture.detectChanges();
    expect(fixture.componentInstance.revealed()).toBe(1);

    fixture.componentInstance.skip();
    fixture.detectChanges();

    expect(fixture.componentInstance.revealed()).toBe(PACK_SIZE);
    expect(fixture.componentInstance.isComplete()).toBe(true);
    expect(fixture.nativeElement.querySelectorAll('.collected-card.is-revealed')).toHaveLength(
      PACK_SIZE,
    );
    const order = [...fixture.nativeElement.querySelectorAll('.collected-card')].map(
      (el: Element) => el.getAttribute('data-stars'),
    );
    expect(order).toEqual(pack.map((c) => String(c.stars)));
  });

  it('leaves no timer running once it has been skipped', () => {
    const fixture = mount();
    fixture.componentInstance.skip();
    fixture.detectChanges();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('zeroes its animations under a reduced-motion block, and keeps the glow', () => {
    const fixture = mount();
    runSequence(fixture);

    const css = [...document.querySelectorAll('style')]
      .map((el) => el.textContent ?? '')
      .join('\n');

    const start = css.indexOf('@media (prefers-reduced-motion: reduce)');
    expect(start).toBeGreaterThan(-1);
    const open = css.indexOf('{', start);
    let depth = 0;
    let body = '';
    for (let i = open; i < css.length; i++) {
      if (css[i] === '{') depth++;
      else if (css[i] === '}' && --depth === 0) {
        body = css.slice(open + 1, i);
        break;
      }
    }

    expect(body).toMatch(/animation:\s*none/);
    expect(body).toMatch(/transition:\s*none/);
    // The emphasis is not an animation, so nothing here takes it away.
    expect(body).not.toMatch(/--rarity-/);
    expect(body).not.toMatch(/filter/);
    expect(css).toMatch(/\.rarity-4[^{]*\{[^}]*--rarity-glow/);
  });

  it('leaves no timer running when destroyed mid-sequence', () => {
    const fixture = mount();
    vi.runOnlyPendingTimers();
    fixture.detectChanges();
    expect(vi.getTimerCount()).toBeGreaterThan(0);

    fixture.destroy();
    expect(vi.getTimerCount()).toBe(0);
  });

  // ─── 6.7 The end state ──────────────────────────────────────────────────

  it('ends with all five cards visible together and a control that closes it', () => {
    const fixture = mount();
    runSequence(fixture);

    expect(fixture.nativeElement.querySelectorAll('.collected-card.is-revealed')).toHaveLength(
      PACK_SIZE,
    );

    const emitted: number[] = [];
    fixture.componentInstance.done.subscribe(() => emitted.push(1));

    const control = fixture.nativeElement.querySelector('.opening-controls button');
    expect(control).not.toBeNull();
    expect(control.tagName).toBe('BUTTON');
    expect(control.getAttribute('type')).toBe('button');
    expect(control.hasAttribute('disabled')).toBe(false);

    control.click();
    expect(emitted).toHaveLength(1);
  });

  it('offers a skip control while revealing and a close control once done', () => {
    const fixture = mount();
    expect(fixture.nativeElement.querySelector('.opening-controls button').textContent).toContain(
      'Skip',
    );
    runSequence(fixture);
    expect(fixture.nativeElement.querySelector('.opening-controls button').textContent).toContain(
      'Return',
    );
  });
});

// ─── 6.2 The fit ────────────────────────────────────────────────────────────

describe('fitOverlay', () => {
  /** A representative laid-out surface, of the order the stylesheet produces. */
  const surface = { width: 820, height: 760 };

  it('applies no transform where the viewport hosts the surface', () => {
    for (const [width, height] of [
      [1920, 1080],
      [1440, 900],
      [1366, 768],
    ]) {
      expect(fitOverlay({ width, height }, surface)).toBe(1);
    }
  });

  it('scales the whole overlay uniformly where the viewport cannot host it', () => {
    const scale = fitOverlay({ width: 600, height: 500 }, surface);
    expect(scale).toBeLessThan(1);
    expect(scale).toBeGreaterThan(0);
    // One factor for both axes — the layout itself never changes.
    expect(fitOverlay({ width: 600, height: 500 }, surface)).toBe(scale);
  });

  it('takes the tighter of the two axes', () => {
    expect(fitOverlay({ width: 410, height: 10_000 }, surface)).toBeCloseTo(0.5, 2);
    expect(fitOverlay({ width: 10_000, height: 380 }, surface)).toBeCloseTo(0.5, 2);
  });

  it('never yields a zero or negative factor', () => {
    for (const available of [
      { width: 0, height: 0 },
      { width: -100, height: -100 },
      { width: 1, height: 1 },
    ]) {
      expect(fitOverlay(available, surface)).toBeGreaterThan(0);
    }
  });

  it('applies no transform before the surface has been measured', () => {
    expect(fitOverlay({ width: 1440, height: 900 }, { width: 0, height: 0 })).toBe(1);
  });
});
