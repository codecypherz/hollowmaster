import { TestBed } from '@angular/core/testing';
import { Card, CARD_BY_KEY, cardKeyOf } from '../../model/card';
import { PACKS, PACK_SIZE, revealOrder } from '../../model/pack';
import { PackOpening, OPENING_SIZE, dwellFor } from './pack-opening';

const crawlid = CARD_BY_KEY.get(cardKeyOf('FC', 1))!; // ★1
const huskWarrior = CARD_BY_KEY.get(cardKeyOf('FC', 15))!; // ★2
const gruzMother = CARD_BY_KEY.get(cardKeyOf('FC', 2))!; // ★3
const goam = CARD_BY_KEY.get(cardKeyOf('FC', 6))!; // ★4

/** A pack already in reveal order: common first, rarest last. */
const pack: Card[] = revealOrder([goam, crawlid, gruzMother, crawlid, huskWarrior]);

function mount(cards: readonly Card[] = pack, def = PACKS[0]) {
  const fixture = TestBed.createComponent(PackOpening);
  fixture.componentRef.setInput('cards', cards);
  fixture.componentRef.setInput('pack', def);
  fixture.detectChanges();
  return fixture;
}

/**
 * Runs the sealed stage out: the seal dwell, then the tear. Two ticks rather
 * than one because the tear's timer is only started when the dwell's fires.
 */
function tearOpen(fixture: ReturnType<typeof mount>) {
  vi.runOnlyPendingTimers();
  fixture.detectChanges();
  vi.runOnlyPendingTimers();
  fixture.detectChanges();
}

describe('PackOpening', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /** Runs the whole timer chain out, the sealed stage included. */
  function runSequence(fixture: ReturnType<typeof mount>) {
    for (let i = 0; i < OPENING_SIZE + 3; i++) {
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
    tearOpen(fixture);
    expect(fixture.componentInstance.hero()).toBe(pack[0]);
    expect(fixture.componentInstance.revealed()).toBe(0);
    expect(fixture.nativeElement.querySelectorAll('.collected-card.is-revealed')).toHaveLength(0);
  });

  // ─── The sealed stage ───────────────────────────────────────────────────

  describe('the sealed pack', () => {
    it('shows the pack that was bought, sealed, before any card', () => {
      const fixture = mount(pack, PACKS[2]);
      const host = fixture.nativeElement as HTMLElement;

      expect(fixture.componentInstance.sealed()).toBe(true);
      expect(fixture.componentInstance.showPack()).toBe(true);

      // The same wrapper the storefront sold: its tier's name, its art.
      const wrapper = host.querySelector('.hero-pack app-pack')!;
      expect(wrapper.querySelector('.pack-name')!.textContent!.trim()).toBe(PACKS[2].name);
      expect(wrapper.classList.contains('is-torn')).toBe(false);

      // And no card yet.
      expect(host.querySelector('.hero-card')).toBeNull();
      expect(fixture.componentInstance.revealed()).toBe(0);
      expect(host.querySelectorAll('.collected-card.is-revealed')).toHaveLength(0);
    });

    it('tears the seal, and only then reveals the first card', () => {
      const fixture = mount();
      const host = fixture.nativeElement as HTMLElement;

      // The dwell ends: the seal breaks, and still no card.
      vi.runOnlyPendingTimers();
      fixture.detectChanges();
      expect(fixture.componentInstance.tearing()).toBe(true);
      expect(host.querySelector('.hero-pack app-pack')!.classList.contains('is-torn')).toBe(true);
      expect(host.querySelector('.hero-card')).toBeNull();
      expect(fixture.componentInstance.revealed()).toBe(0);

      // The tear ends: the pack gives way to the first card rising out of it.
      vi.runOnlyPendingTimers();
      fixture.detectChanges();
      expect(fixture.componentInstance.showPack()).toBe(false);
      expect(host.querySelector('.hero-pack')).toBeNull();
      const hero = host.querySelector('.hero-card')!;
      expect(hero.classList.contains('from-pack')).toBe(true);
      expect(fixture.componentInstance.hero()).toBe(pack[0]);
    });

    it('leaves no stage behind when the sequence ends', () => {
      const fixture = mount();
      runSequence(fixture);
      expect(fixture.componentInstance.sealed()).toBe(false);
      expect(fixture.componentInstance.tearing()).toBe(false);
      expect(fixture.componentInstance.showPack()).toBe(false);
      expect(fixture.nativeElement.querySelector('.hero-pack')).toBeNull();
    });

    it('shows the whole result when skipped while still sealed', () => {
      const fixture = mount();
      expect(fixture.componentInstance.sealed()).toBe(true);

      fixture.componentInstance.skip();
      fixture.detectChanges();

      expect(fixture.componentInstance.revealed()).toBe(PACK_SIZE);
      expect(fixture.componentInstance.isComplete()).toBe(true);
      expect(fixture.componentInstance.showPack()).toBe(false);
      expect(fixture.nativeElement.querySelectorAll('.collected-card.is-revealed')).toHaveLength(
        PACK_SIZE,
      );
      // No further stage of the sequence plays.
      expect(vi.getTimerCount()).toBe(0);
    });

    it('plays no tear at all under reduced motion', () => {
      vi.stubGlobal('matchMedia', () => ({ matches: true }) as MediaQueryList);
      try {
        const fixture = mount();
        expect(fixture.componentInstance.sealed()).toBe(false);
        expect(fixture.componentInstance.tearing()).toBe(false);
        expect(fixture.nativeElement.querySelector('.hero-pack')).toBeNull();
        expect(fixture.componentInstance.revealed()).toBe(PACK_SIZE);
        expect(vi.getTimerCount()).toBe(0);
      } finally {
        vi.unstubAllGlobals();
      }
    });
  });

  // ─── 6.3 The sequence ───────────────────────────────────────────────────

  it('collects the cards one at a time, in the order it was given them', () => {
    const fixture = mount();
    tearOpen(fixture);
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
    tearOpen(fixture);
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
    tearOpen(fixture);
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
