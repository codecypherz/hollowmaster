import { TestBed } from '@angular/core/testing';
import { PACKS, PACK_SIZE, PackDefinition } from '../../model/pack';
import { PackComponent } from './pack';

function mount(pack: PackDefinition = PACKS[0], torn?: boolean) {
  const fixture = TestBed.createComponent(PackComponent);
  fixture.componentRef.setInput('pack', pack);
  if (torn !== undefined) fixture.componentRef.setInput('torn', torn);
  fixture.detectChanges();
  return fixture;
}

describe('PackComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  // ─── 2.1 The renderer ───────────────────────────────────────────────────

  it('prints the tier name as text on the wrapper', () => {
    for (const pack of PACKS) {
      const host = mount(pack).nativeElement as HTMLElement;
      const name = host.querySelector('.pack-name')!;
      expect(name.textContent!.trim()).toBe(pack.name);
      // Inside the wrapper, not beside it.
      expect(name.closest('.wrapper')).not.toBeNull();
    }
  });

  it('draws the tier art as the wrapper face, decoratively', () => {
    const host = mount(PACKS[2]).nativeElement as HTMLElement;
    const art = host.querySelector('img.pack-art') as HTMLImageElement;
    expect(art.getAttribute('src')).toBe(PACKS[2].art);
    // The wrapper names itself in text; the image repeats nothing.
    expect(art.getAttribute('alt')).toBe('');
  });

  it('renders sealed unless a state is asked for', () => {
    const fixture = mount();
    expect(fixture.componentInstance.torn()).toBe(false);
    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList.contains('is-torn')).toBe(false);
    expect(host.querySelector('.crimp-top')).not.toBeNull();
    expect(host.querySelector('.crimp-bottom')).not.toBeNull();
  });

  it('marks itself torn when asked, keeping every other part', () => {
    const fixture = mount(PACKS[1], true);
    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList.contains('is-torn')).toBe(true);

    // The same wrapper after the fact: art, name, trim, and bottom crimp all
    // still drawn — what the torn state changes is the top edge.
    expect(host.querySelector('img.pack-art')).not.toBeNull();
    expect(host.querySelector('.pack-name')!.textContent!.trim()).toBe(PACKS[1].name);
    expect(host.querySelector('.crimp-bottom')).not.toBeNull();
    expect(host.querySelector('.wrapper')).not.toBeNull();
  });
  // ─── 2.6 The wrapper carries the name and nothing else ──────────────────

  it('prints no card count, no odds, and no price', () => {
    for (const pack of PACKS) {
      const host = mount(pack).nativeElement as HTMLElement;
      const printed = host.textContent!.trim();

      // The name is the whole of the copy on the wrapper.
      expect(printed).toBe(pack.name);
      expect(printed).not.toContain(String(PACK_SIZE));
      expect(printed.toLowerCase()).not.toContain('card');
      expect(printed).not.toMatch(/\d+\s*%/);
      expect(printed).not.toContain(String(pack.price));
      expect(printed.toLowerCase()).not.toContain('geo');
      expect(host.querySelector('app-geo')).toBeNull();
    }
  });
});
