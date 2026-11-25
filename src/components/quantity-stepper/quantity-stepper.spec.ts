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

  it('shows its value and emits which control was pressed', () => {
    expect(el('.value').textContent!.trim()).toBe('2');
    el('.raise').click();
    el('.lower').click();
    expect(pressed).toEqual(['increase', 'decrease']);
    // It holds no state: the value is whatever it is given.
    expect(el('.value').textContent!.trim()).toBe('2');
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
});
