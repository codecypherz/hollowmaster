import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CardComponent } from './card';
import { Card } from '../../model/card';

/**
 * The card is the one place the look-and-feel constraints are enforced, so the
 * constraints are asserted here rather than re-checked by eye on every screen.
 */
describe('CardComponent', () => {
  let fixture: ComponentFixture<CardComponent>;
  let host: HTMLElement;

  const sample = new Card('Gruz Mother', 3, 'gruz-mother.png', {
    attack: 45,
    defense: 40,
    arrows: ['N', 'S', 'E', 'W'],
  });

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

  describe('three-section face', () => {
    it('renders name, image, and stats sections in order', () => {
      render();
      const sections = [...host.querySelectorAll('.face > *')].map((e) => e.className);
      expect(sections[0]).toContain('cf-name');
      expect(sections[1]).toContain('cf-img');
      expect(sections[2]).toContain('cf-stats');
    });

    it('shows the card name', () => {
      render();
      expect(host.querySelector('.cf-name-text')?.textContent?.trim()).toBe('Gruz Mother');
    });
  });

  describe('chevrons', () => {
    it('renders all eight compass positions regardless of which are active', () => {
      render({ card: new Card('Crawlid', 1, undefined, { attack: 5, defense: 5, arrows: ['N'] }) });
      expect(host.querySelectorAll('.arr').length).toBe(8);
    });

    it('marks only the directions the card possesses as active', () => {
      render();
      const on = [...host.querySelectorAll('.arr-on')].map((e) =>
        [...e.classList].find((c) => c.startsWith('arr-') && c !== 'arr-on'),
      );
      expect(on.sort()).toEqual(['arr-e', 'arr-n', 'arr-s', 'arr-w']);
    });

    it('keeps chevrons outside the three sections', () => {
      render();
      const face = host.querySelector('.face')!;
      expect(face.querySelector('.arr')).toBeNull();
    });
  });

  describe('rarity and stats', () => {
    it('renders rarity as one star per level', () => {
      render();
      expect(host.querySelector('.cf-img .cf-stars')?.textContent).toBe('★★★');
    });

    it('never renders a numeral anywhere on the card', () => {
      render();
      const visible = host.cloneNode(true) as HTMLElement;
      visible.querySelectorAll('.sr-only').forEach((e) => e.remove());
      expect(visible.textContent ?? '').not.toMatch(/[0-9]/);
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
    });
  });

  describe('states', () => {
    it('reveals nothing when face down', () => {
      render({ card: null, faceDown: true });
      expect(host.querySelector('.frame.back')).not.toBeNull();
      expect(host.querySelector('.cf-name')).toBeNull();
      expect(host.querySelector('.cf-img')).toBeNull();
      expect(host.querySelector('.cf-stats')).toBeNull();
      expect(host.querySelector('.arr')).toBeNull();
      expect(host.textContent?.trim()).toBe('');
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
