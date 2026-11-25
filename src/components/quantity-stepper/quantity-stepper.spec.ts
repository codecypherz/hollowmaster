import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QuantityStepper } from './quantity-stepper';

describe('QuantityStepper', () => {
  let fixture: ComponentFixture<QuantityStepper>;
  let pressed: string[];

  beforeEach(() => {
    fixture = TestBed.createComponent(QuantityStepper);
    const set = fixture.componentRef.setInput.bind(fixture.componentRef);
    set('value', 2);
    set('canLower', true);
    set('canRaise', true);
    set('lowerLabel', 'Sell one fewer Crawlid');
    set('raiseLabel', 'Sell one more Crawlid');
    set('fieldLabel', 'Copies of Crawlid to sell');
    set('lowerReason', 'Nothing pending');
    set('raiseReason', 'Every copy you hold is pending');
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
    pressed = [];
    fixture.componentInstance.decrease.subscribe(() => pressed.push('decrease'));
    fixture.componentInstance.increase.subscribe(() => pressed.push('increase'));
  });

  afterEach(() => fixture.nativeElement.remove());

  const el = (selector: string): HTMLButtonElement => fixture.nativeElement.querySelector(selector);

  const field = () => el('.value') as unknown as HTMLInputElement;

  /** The value the parent then holds, as a clamping parent would hand back. */
  function holding(clamp: (n: number) => number): number[] {
    const entered: number[] = [];
    fixture.componentInstance.entered.subscribe((n) => {
      entered.push(n);
      fixture.componentRef.setInput('value', clamp(n));
    });
    return entered;
  }

  function type(text: string): void {
    field().focus();
    field().value = text;
    field().dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
  }

  function press(key: string): KeyboardEvent {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    field().dispatchEvent(event);
    fixture.detectChanges();
    return event;
  }

  it('shows its value and emits which control was pressed', () => {
    expect(field().value).toBe('2');
    el('.raise').click();
    el('.lower').click();
    expect(pressed).toEqual(['increase', 'decrease']);
    // It holds no state: the value is whatever it is given.
    expect(field().value).toBe('2');
  });

  it('names the card each control acts on', () => {
    expect(el('.lower').getAttribute('aria-label')).toBe('Sell one fewer Crawlid');
    expect(el('.raise').getAttribute('aria-label')).toBe('Sell one more Crawlid');
  });

  it('states no reason while a control is available', () => {
    for (const control of ['.lower', '.raise']) {
      expect(el(control).getAttribute('aria-disabled')).toBeNull();
      expect(el(control).getAttribute('title')).toBeNull();
      expect(el(control).getAttribute('aria-describedby')).toBeNull();
    }
  });

  it('keeps an unavailable end focusable, inert, and described', () => {
    fixture.componentRef.setInput('canLower', false);
    fixture.componentRef.setInput('canRaise', false);
    fixture.detectChanges();

    for (const [control, reason] of [
      ['.lower', 'Nothing pending'],
      ['.raise', 'Every copy you hold is pending'],
    ]) {
      const button = el(control);
      expect(button.disabled).toBe(false);
      expect(button.getAttribute('aria-disabled')).toBe('true');
      expect(button.getAttribute('title')).toBe(reason);
      const described = button.getAttribute('aria-describedby')!;
      expect(fixture.nativeElement.querySelector(`#${described}`).textContent).toBe(reason);
      button.focus();
      expect(document.activeElement).toBe(button);
      button.click();
    }
    expect(pressed).toEqual([]);
  });

  it('keeps focus on the control whose press reached a bound', () => {
    el('.raise').focus();
    el('.raise').click();
    fixture.componentRef.setInput('canRaise', false);
    fixture.detectChanges();
    expect(document.activeElement).toBe(el('.raise'));
  });

  describe('the field', () => {
    it('is named, and is one segment of the bar', () => {
      expect(field().getAttribute('aria-label')).toBe('Copies of Crawlid to sell');
      expect(fixture.nativeElement.classList).toContain('hk-seg');
      expect(field().classList).toContain('hk-seg-field');
    });

    it('commits once between Enter and the blur after it', () => {
      const entered = holding((n) => n);
      type('25');
      press('Enter');
      expect(document.activeElement).toBe(field());
      field().blur();
      fixture.detectChanges();
      expect(entered).toEqual([25]);
      expect(field().value).toBe('25');
    });

    it('commits on leaving it', () => {
      const entered = holding((n) => n);
      type('4');
      field().blur();
      expect(entered).toEqual([4]);
    });

    it('commits nothing while it is being typed in, or where nothing was typed', () => {
      const entered = holding((n) => n);
      field().focus();
      press('Enter');
      field().blur();
      type('12');
      expect(entered).toEqual([]);
      expect(field().value).toBe('12');
    });

    it('drops everything but digits, though that leaves its text as it was', () => {
      const entered = holding((n) => n);
      type('2e');
      expect(field().value).toBe('2');
      type('-x3.');
      expect(field().value).toBe('3');
      press('Enter');
      expect(entered).toEqual([3]);
    });

    it('restores the value when it is left empty', () => {
      const entered = holding((n) => n);
      type('');
      field().blur();
      fixture.detectChanges();
      expect(entered).toEqual([]);
      expect(field().value).toBe('2');
    });

    it('reads a padded number as the number, and redraws it', () => {
      const entered = holding((n) => n);
      type('002');
      press('Enter');
      expect(entered).toEqual([]);
      expect(field().value).toBe('2');
    });

    it('redraws a clamped value even when the value did not change', () => {
      const entered = holding(() => 2);
      for (const text of ['50', '50', '9']) {
        type(text);
        press('Enter');
        expect(field().value).toBe('2');
      }
      expect(entered).toEqual([50, 50, 9]);
    });

    it('redraws a clamped value that did change', () => {
      holding(() => 3);
      type('50');
      press('Enter');
      expect(field().value).toBe('3');
    });

    it('abandons an edit on Escape, letting it out only when there is none', () => {
      const entered = holding((n) => n);
      let outside = 0;
      const listen = () => outside++;
      document.body.addEventListener('keydown', listen);

      type('8');
      press('Escape');
      expect(outside).toBe(0);
      expect(field().value).toBe('2');
      field().blur();
      expect(entered).toEqual([]);

      press('Escape');
      expect(outside).toBe(1);
      document.body.removeEventListener('keydown', listen);
    });

    it('commits before a press on either control, even one that was unavailable', () => {
      const entered = holding((n) => n);
      fixture.componentRef.setInput('canRaise', false);
      fixture.detectChanges();
      type('1');
      el('.raise').click();
      expect(entered).toEqual([1]);
      expect(pressed).toEqual(['increase']);

      fixture.detectChanges();
      el('.raise').click();
      expect(pressed).toEqual(['increase']);
    });

    it('selects the quantity when pressed, until it is being typed in', () => {
      const press = () => {
        const event = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
        field().dispatchEvent(event);
        return event.defaultPrevented;
      };
      expect(press()).toBe(true);
      expect(document.activeElement).toBe(field());
      expect([field().selectionStart, field().selectionEnd]).toEqual([0, 1]);
      type('12');
      expect(press()).toBe(false);
    });

    it('stays focusable, with its reason, when it cannot be edited', () => {
      fixture.componentRef.setInput('canRaise', false);
      fixture.componentRef.setInput('editable', false);
      fixture.detectChanges();

      expect(field().readOnly).toBe(true);
      expect(field().disabled).toBe(false);
      expect(field().getAttribute('aria-disabled')).toBe('true');
      expect(field().title).toBe('Every copy you hold is pending');
      const described = field().getAttribute('aria-describedby')!;
      expect(fixture.nativeElement.querySelector(`#${described}`).textContent).toBe(
        'Every copy you hold is pending',
      );
      field().focus();
      expect(document.activeElement).toBe(field());
    });
  });
});
