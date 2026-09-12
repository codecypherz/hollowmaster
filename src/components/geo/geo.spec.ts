import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Geo } from './geo';

function mount(amount: number) {
  const fixture = TestBed.createComponent(Geo);
  fixture.componentRef.setInput('amount', amount);
  fixture.detectChanges();
  return fixture;
}

/** The host element's rendered children, whitespace-only nodes aside. */
function parts(host: HTMLElement): Element[] {
  return [...host.children];
}

/**
 * The name a screen reader would build from a subtree: the text it contains,
 * with every image contributing its `alt` in the place the image sits.
 *
 * An approximation of the accessible name computation rather than the whole of
 * it — there is no layout and no accessibility tree here — but it is exactly
 * the part this primitive is responsible for: that the mark is named at all,
 * and that its name lands beside the numeral rather than instead of it.
 */
function accessibleName(root: Element): string {
  const words: string[] = [];
  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim() ?? '';
      if (text) words.push(text);
      return;
    }
    if (node instanceof HTMLImageElement) {
      const alt = node.getAttribute('alt')?.trim() ?? '';
      if (alt) words.push(alt);
      return;
    }
    node.childNodes.forEach(walk);
  };
  root.childNodes.forEach(walk);
  return words.join(' ');
}

describe('Geo', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  // ─── 1.2 The amount, then the mark ──────────────────────────────────────

  it('renders the numeral first and the mark immediately after it', () => {
    const host = mount(500).nativeElement as HTMLElement;
    const [value, mark] = parts(host);

    expect(value.classList.contains('geo-value')).toBe(true);
    expect(value.textContent!.trim()).toBe('500');

    expect(mark.tagName).toBe('IMG');
    expect(mark.classList.contains('geo-mark')).toBe(true);
    expect(parts(host)).toHaveLength(2);
    // Order, stated as position rather than inferred from the destructuring.
    expect(value.compareDocumentPosition(mark) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('names the mark as the currency rather than leaving it an image', () => {
    const mark = (mount(100).nativeElement as HTMLElement).querySelector('img.geo-mark')!;
    expect(mark.getAttribute('alt')).toBe('Geo');
    expect(mark.getAttribute('src')).toBe('/images/geo.png');
  });

  it('carries the primitive classes rather than a treatment of its own', () => {
    const host = mount(1).nativeElement as HTMLElement;
    expect(host.classList.contains('geo-amount')).toBe(true);
  });

  it('shows zero as zero rather than as a blank', () => {
    const host = mount(0).nativeElement as HTMLElement;
    expect(host.querySelector('.geo-value')!.textContent!.trim()).toBe('0');
    expect(host.querySelector('img.geo-mark')).not.toBeNull();
  });

  // ─── 1.3 The amount as a control's whole label ──────────────────────────

  describe('as a button label', () => {
    @Component({
      imports: [Geo],
      template: `<button type="button"><app-geo [amount]="100" /></button>`,
    })
    class PriceButton {}

    it('gives the button a name carrying both the amount and the currency', () => {
      const fixture = TestBed.createComponent(PriceButton);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button')!;
      const name = accessibleName(button);
      expect(name).toContain('100');
      expect(name).toContain('Geo');
      // The word is the mark's name, not copy set beside the number.
      expect(button.textContent).not.toContain('Geo');
    });
  });
});
