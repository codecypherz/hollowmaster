import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CARD_BY_KEY, Card, cardKeyOf } from '../../model/card';
import { UserService } from '../../services/user.service';
import { ExchangeRates } from './exchange-rates';

const goam = CARD_BY_KEY.get(cardKeyOf('FC', 6))!; // four stars, sells for 33

describe('ExchangeRates', () => {
  let fixture: ComponentFixture<ExchangeRates>;
  let el: HTMLElement;
  let users: UserService;
  let outside: HTMLButtonElement;

  beforeEach(() => {
    users = TestBed.inject(UserService);
    fixture = TestBed.createComponent(ExchangeRates);
    el = fixture.nativeElement;
    outside = document.createElement('button');
    document.body.append(el, outside);
    fixture.detectChanges();
  });

  afterEach(() => {
    el.remove();
    outside.remove();
  });

  const purse = () => el.querySelector<HTMLButtonElement>('button.purse')!;
  const panel = () => el.querySelector<HTMLElement>(`#${purse().getAttribute('aria-controls')}`)!;
  const isOpen = () => {
    expect(purse().getAttribute('aria-expanded')).toBe(String(!panel().hidden));
    return !panel().hidden;
  };

  function open(): void {
    purse().focus();
    purse().click();
    fixture.detectChanges();
    expect(isOpen()).toBe(true);
  }

  /** Earns Rosaries the way a player does: by selling cards. */
  function earn(copies: number): void {
    users.grantCards(Array<Card>(copies).fill(goam));
    users.settle([{ key: cardKeyOf('FC', 6), action: 'sell', quantity: copies }]);
    fixture.detectChanges();
  }

  /** Each line as stars, in words, then its sell and buy amounts. */
  const lines = () =>
    [...el.querySelectorAll('tbody tr')].map((row) => [
      row.querySelector('th .sr-only')!.textContent,
      ...[...row.querySelectorAll('.rosary-value')].map((value) => Number(value.textContent)),
    ]);

  it('is a button named for the balance, collapsed, with a chevron to its left', () => {
    expect(purse().getAttribute('aria-label')).toBe('Your Rosaries, 0');
    expect(isOpen()).toBe(false);
    expect(purse().firstElementChild!.classList).toContain('purse-chevron');
    expect(purse().querySelector('img.rosary-mark')!.getAttribute('alt')).toBe('Rosaries');

    earn(1);
    expect(purse().getAttribute('aria-label')).toBe('Your Rosaries, 33');
  });

  it('opens and closes by the same button', () => {
    open();
    purse().click();
    fixture.detectChanges();
    expect(isOpen()).toBe(false);
  });

  it('lists five rates to a new player and mentions no sixth', () => {
    open();
    expect(lines()).toEqual([
      ['1 star', 1, 4],
      ['2 stars', 3, 12],
      ['3 stars', 9, 27],
      ['4 stars', 33, 99],
      ['5 stars', 330, 660],
    ]);
    expect(panel().textContent).not.toMatch(/6 stars|six|9999|5000|★{6}/i);
    expect([...el.querySelectorAll('thead th')].map((th) => th.textContent)).toEqual([
      'Rarity',
      'Sell',
      'Buy',
    ]);
    expect(el.querySelectorAll('tbody app-rosary')).toHaveLength(10);
  });

  it('lists the sixth once it is earned, without being redrawn', () => {
    open();
    earn(302);
    expect(users.rosaries()).toBe(9966);
    expect(lines()).toHaveLength(5);
    earn(1);
    expect(users.rosaries()).toBe(9999);
    expect(lines().at(-1)).toEqual(['6 stars', 5000, 9999]);
  });

  it('offers nothing but the button', () => {
    open();
    expect(el.querySelectorAll('button, a, input, [tabindex]')).toHaveLength(1);
  });

  it('closes on Escape, leaving focus on the button', () => {
    open();
    outside.remove();
    purse().blur();
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(isOpen()).toBe(false);
    expect(document.activeElement).toBe(purse());
  });

  it('closes on a press outside and not on one inside', () => {
    open();
    panel().click();
    fixture.detectChanges();
    expect(isOpen()).toBe(true);
    outside.click();
    fixture.detectChanges();
    expect(isOpen()).toBe(false);
  });

  it('closes when focus moves elsewhere', () => {
    open();
    outside.focus();
    fixture.detectChanges();
    expect(isOpen()).toBe(false);
    expect(document.activeElement).toBe(outside);
  });
});
