import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CardComponent } from './card';
import { Card, CardOptions } from '../../model/card';

/**
 * The card is the one place the look-and-feel constraints are enforced, so the
 * constraints are asserted here rather than re-checked by eye on every screen.
 */
describe('CardComponent', () => {
  let fixture: ComponentFixture<CardComponent>;
  let host: HTMLElement;

  /** Every card needs all nine properties; a test should state only the ones it asserts on. */
  function card(overrides: Partial<CardOptions> = {}): Card {
    return new Card({
      name: 'Gruz Mother',
      arrows: ['N', 'S', 'E', 'W'],
      stars: 3,
      image: 'gruz-mother.png',
      attack: 45,
      defense: 40,
      ability: 'Hurls her bulk from wall to wall.',
      set: 'Forgotten Crossroads',
      number: 2,
      ...overrides,
    });
  }

  const sample = card();

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CardComponent] }).compileComponents();
    fixture = TestBed.createComponent(CardComponent);
    host = fixture.nativeElement as HTMLElement;
  });

  function render(props: Record<string, unknown> = {}) {
    for (const [k, v] of Object.entries({ card: sample, ...props })) {
      fixture.componentRef.setInput(k, v);
    }
    fixture.detectChanges();
  }

  describe('four-section face', () => {
    it('renders name, image, stats, and ability sections in order', () => {
      render();
      const sections = [...host.querySelectorAll('.face > *')].map((e) => e.className);
      expect(sections.length).toBe(4);
      expect(sections[0]).toContain('cf-name');
      expect(sections[1]).toContain('cf-img');
      expect(sections[2]).toContain('cf-stats');
      expect(sections[3]).toContain('cf-ability');
    });

    it('shows the card name', () => {
      render();
      expect(host.querySelector('.cf-name-text')?.textContent?.trim()).toBe('Gruz Mother');
    });
  });

  describe('chevrons', () => {
    it('renders all eight compass positions regardless of which are active', () => {
      render({ card: card({ name: 'Crawlid', arrows: ['N'], stars: 1, image: 'crawlid.webp' }) });
      expect(host.querySelectorAll('.arr').length).toBe(8);
    });

    it('marks only the directions the card possesses as active', () => {
      render();
      const on = [...host.querySelectorAll('.arr-on')].map((e) =>
        [...e.classList].find((c) => c.startsWith('arr-') && c !== 'arr-on'),
      );
      expect(on.sort()).toEqual(['arr-e', 'arr-n', 'arr-s', 'arr-w']);
    });

    it('keeps chevrons outside the four sections', () => {
      render();
      const face = host.querySelector('.face')!;
      expect(face.querySelector('.arr')).toBeNull();
    });
  });

  describe('star track', () => {
    /** The track is a fixed five slots at every rating, so the ceiling reads without a legend. */
    function starTrack(stars: number) {
      render({ card: card({ stars }) });
      const track = host.querySelector('.cf-img .cf-stars')!;
      return {
        slots: track.querySelectorAll('.star').length,
        lit: track.querySelectorAll('.star.lit').length,
        sixth: track.querySelector('.star-six'),
      };
    }

    it('always renders five slots, whatever the rating', () => {
      for (const stars of [1, 2, 3, 4, 5, 6]) {
        expect(starTrack(stars).slots).toBe(5);
      }
    });

    it('lights one slot per level up to five', () => {
      for (const stars of [1, 2, 3, 4, 5]) {
        expect(starTrack(stars).lit).toBe(stars);
      }
    });

    it('fills the track and adds the sixth star at a rating of six', () => {
      const six = starTrack(6);
      expect(six.lit).toBe(5);
      expect(six.sixth).not.toBeNull();
    });

    it('omits the sixth star entirely below six — not lit, not unlit, not reserved', () => {
      for (const stars of [1, 2, 3, 4, 5]) {
        expect(starTrack(stars).sixth).toBeNull();
      }
    });
  });

  describe('stats', () => {
    /** The visible face, with the accessible-only text and the collector plate removed. */
    function visibleText(): string {
      const visible = host.cloneNode(true) as HTMLElement;
      visible.querySelectorAll('.sr-only, .cf-plate').forEach((e) => e.remove());
      return visible.textContent ?? '';
    }

    it('never renders an attack, defense, or rating numeral', () => {
      render();
      expect(visibleText()).not.toMatch(/[0-9]/);
    });

    it('renders the collector number, zero-padded, on the identity plate', () => {
      render();
      expect(host.querySelector('.cf-plate .cf-number')?.textContent?.trim()).toBe('002');
      expect(host.querySelector('.cf-plate .cf-set')?.textContent?.trim()).toBe(
        'Forgotten Crossroads',
      );
    });

    it('labels each bar inside the bar itself, with no stat icons', () => {
      render();
      const bars = [...host.querySelectorAll('.cf-stats .stat-bar')];
      expect(bars.map((b) => b.querySelector('.stat-label')?.textContent?.trim())).toEqual([
        'AT',
        'DE',
      ]);
      expect(host.querySelector('.cf-stats img')).toBeNull();
    });

    it('fills each stat bar to the stat percentage', () => {
      render();
      const atk = host.querySelector<HTMLElement>('.atk-fill')!;
      const def = host.querySelector<HTMLElement>('.def-fill')!;
      expect(atk.style.width).toBe('45%');
      expect(def.style.width).toBe('40%');
    });

    it('exposes the stats to assistive technology as text', () => {
      render({ selectable: true });
      const label = host.querySelector('button')!.getAttribute('aria-label')!;
      expect(label).toContain('attack 45');
      expect(label).toContain('defense 40');
      expect(label).toContain('Forgotten Crossroads 002');
    });
  });

  describe('ability', () => {
    it('keeps the ability in the DOM so the size gate is visual only', () => {
      render();
      expect(host.querySelector('.cf-ability-text')?.textContent?.trim()).toBe(
        'Hurls her bulk from wall to wall.',
      );
    });

    it('points the frame at its own ability text through aria-describedby', () => {
      render({ selectable: true });
      const id = host.querySelector('button')!.getAttribute('aria-describedby')!;
      expect(host.querySelector(`#${id}`)?.textContent?.trim()).toBe(
        'Hurls her bulk from wall to wall.',
      );
    });

    it('gives each rendered card its own ability id', () => {
      const other = TestBed.createComponent(CardComponent);
      other.componentRef.setInput('card', sample);
      other.detectChanges();
      expect(fixture.componentInstance.abilityId).not.toBe(other.componentInstance.abilityId);
    });
  });

  describe('rarity', () => {
    it('states the rating on the host so the frame can reflect it', () => {
      render({ card: card({ stars: 3 }) });
      expect(host.getAttribute('data-rarity')).toBe('3');
    });
  });

  describe('states', () => {
    it('reveals nothing when face down', () => {
      render({ faceDown: true });
      expect(host.querySelector('.frame.back')).not.toBeNull();
      expect(host.querySelector('.cf-name')).toBeNull();
      expect(host.querySelector('.cf-img')).toBeNull();
      expect(host.querySelector('.cf-stats')).toBeNull();
      expect(host.querySelector('.cf-ability')).toBeNull();
      expect(host.querySelector('.cf-stars')).toBeNull();
      expect(host.querySelector('.star')).toBeNull();
      expect(host.querySelector('.arr')).toBeNull();
      expect(host.textContent?.trim()).toBe('');
      expect(host.getAttribute('data-rarity')).toBeNull();
    });

    it('marks ownership on the host', () => {
      render({ owner: 'player' });
      expect(host.classList).toContain('owner-player');
      render({ owner: 'opponent' });
      expect(host.classList).toContain('owner-opponent');
    });

    it('carries ownership by a shape marker, not colour alone', () => {
      render({ owner: 'opponent' });
      expect(host.querySelector('.owner-pip')).not.toBeNull();
    });

    it('applies the capture transition when flipped', () => {
      render({ owner: 'player', flipped: true });
      expect(host.classList).toContain('is-flipped');
    });

    it('marks an interactive card that cannot be chosen right now as inert', () => {
      render({ interactive: true, selectable: false });
      expect(host.classList).toContain('is-inert');
    });

    it('does not mark a display-only card as inert', () => {
      render({ owner: 'player' });
      expect(host.classList).not.toContain('is-inert');
    });
  });

  describe('interaction', () => {
    it('renders an actionable card as a focusable button', () => {
      render({ selectable: true });
      expect(host.querySelector('button')).not.toBeNull();
    });

    it('keeps a display-only card out of the tab order', () => {
      render({ owner: 'player' });
      expect(host.querySelector('button')).toBeNull();
    });

    it('emits select when activated', () => {
      render({ selectable: true });
      let emitted = 0;
      fixture.componentInstance.select.subscribe(() => emitted++);
      host.querySelector('button')!.click();
      expect(emitted).toBe(1);
    });

    it('reports selection through aria-pressed', () => {
      render({ selectable: true, selected: true });
      expect(host.querySelector('button')!.getAttribute('aria-pressed')).toBe('true');
      expect(host.classList).toContain('is-selected');
    });

    it('does not emit when it is not selectable', () => {
      render({ interactive: true, selectable: false });
      let emitted = 0;
      fixture.componentInstance.select.subscribe(() => emitted++);
      fixture.componentInstance.onActivate();
      expect(emitted).toBe(0);
    });
  });
});
