import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CARD_BY_KEY, cardKeyOf } from '../../model/card';
import { NO_MILESTONES, PersistedUser, SCHEMA_VERSION } from '../../model/user';
import { CartService } from '../../services/cart.service';
import { USER_STORE, UserStore } from '../../services/user-store';
import { UserService } from '../../services/user.service';
import { CartDialog } from './cart-dialog';

const crawlid = CARD_BY_KEY.get(cardKeyOf('FC', 1))!; // one star
const gruzMother = CARD_BY_KEY.get(cardKeyOf('FC', 2))!; // three stars
const aspidMother = CARD_BY_KEY.get(cardKeyOf('FC', 5))!; // two stars
const vengefly = CARD_BY_KEY.get(cardKeyOf('FC', 7))!; // one star

const held = (number: number, quantity: number) => ({ set: 'FC', number, quantity });
const ref = (number: number) => ({ set: 'FC', number });

function storeWith(record: Partial<PersistedUser>): UserStore {
  return {
    load: async () => ({
      version: SCHEMA_VERSION,
      geo: 0,
      rosaries: 0,
      collection: [],
      decks: [],
      milestones: NO_MILESTONES,
      ...record,
    }),
    save: async () => {},
  };
}

describe('CartDialog', () => {
  let fixture: ComponentFixture<CartDialog>;
  let el: HTMLElement;
  let cart: CartService;
  let users: UserService;
  let confirmed: number;
  let closed: number;

  /** Loads a user, fills the cart, and opens the dialog on it. */
  async function open(record: Partial<PersistedUser>, fill: () => void = () => {}): Promise<void> {
    TestBed.configureTestingModule({
      providers: [{ provide: USER_STORE, useValue: storeWith(record) }],
    });
    users = TestBed.inject(UserService);
    cart = TestBed.inject(CartService);
    await users.load();
    fill();
    fixture = TestBed.createComponent(CartDialog);
    el = fixture.nativeElement;
    document.body.appendChild(el);
    confirmed = 0;
    closed = 0;
    fixture.componentInstance.confirm.subscribe(() => confirmed++);
    fixture.componentInstance.close.subscribe(() => closed++);
    fixture.detectChanges();
  }

  afterEach(() => el.remove());

  const q = (selector: string) => el.querySelector<HTMLElement>(selector)!;
  const lines = () => [...el.querySelectorAll<HTMLElement>('.line')];
  const line = (slug: string) => q(`[data-line="${slug}"]`);
  const text = (node: Element | null) => node!.textContent!.replace(/\s+/g, '');
  const effect = (slug: string) => text(line(slug).querySelector('.line-effect [aria-hidden]'));
  const total = (name: string) => {
    const dd = el.querySelector(`[data-total="${name}"] dd`);
    return dd && text(dd.querySelector('[aria-hidden]') ?? dd);
  };
  const confirm = () => q('.cart-confirm') as HTMLButtonElement;
  const announced = () => q('[data-testid="cart-announcement"]').textContent!.trim();
  const described = (node: HTMLElement) =>
    q(`#${node.getAttribute('aria-describedby')}`).textContent!.trim();
  const unavailable = (node: Element) => node.getAttribute('aria-disabled') === 'true';

  function press(control: HTMLElement): void {
    control.focus();
    control.click();
    fixture.detectChanges();
  }

  // ─── Rows ─────────────────────────────────────────────────────────────────

  it('lists a sale and a purchase in the order they were added, as text', async () => {
    await open({ collection: [held(5, 4)] }, () => {
      cart.setQuantity(aspidMother, 'sell', 3);
      cart.setQuantity(crawlid, 'buy', 2);
    });
    expect(lines().map((row) => row.dataset['line'])).toEqual(['FC-5', 'FC-1']);

    const sale = line('FC-5');
    expect(text(sale.querySelector('.line-action'))).toBe('Sell');
    expect(sale.querySelector('.line-name')!.textContent!.trim()).toBe('Aspid Mother');
    expect(sale.querySelector<HTMLInputElement>('.value')!.value).toBe('3');
    expect(effect('FC-5')).toBe('+9');
    expect(sale.querySelector('.line-effect img.rosary-mark')).not.toBeNull();
    expect(sale.querySelector('.line-effect .sr-only')!.textContent).toBe('gains 9 Rosaries');

    expect(text(line('FC-1').querySelector('.line-action'))).toBe('Buy');
    expect(effect('FC-1')).toBe('−8');
    expect(line('FC-1').querySelector('.line-effect .sr-only')!.textContent).toBe(
      'spends 8 Rosaries',
    );
    // The sign comes immediately before the amount, and the mark after it.
    const signed = line('FC-1').querySelector('.signed')!;
    expect([...signed.children].map((node) => node.tagName)).toEqual(['SPAN', 'APP-ROSARY']);
  });

  it('renders no card', async () => {
    await open({}, () => cart.setQuantity(crawlid, 'buy', 1));
    expect(lines()).toHaveLength(1);
    expect(el.querySelector('app-card')).toBeNull();
    expect([...el.querySelectorAll('img')].every((i) => i.classList.contains('rosary-mark'))).toBe(
      true,
    );
  });

  it('says so when the cart is empty', async () => {
    await open({ rosaries: 30 });
    expect(q('.cart-empty').textContent).toContain('The cart is empty');
    expect(lines()).toHaveLength(0);
    expect(total('balance')).toBe('30');
    expect(total('net')).toBe('0');
    expect(total('after')).toBe('30');
  });

  it('adjusts a quantity, with its effect and the totals following', async () => {
    await open({ rosaries: 50, collection: [held(1, 3)] }, () =>
      cart.setQuantity(crawlid, 'sell', 2),
    );
    const raise = line('FC-1').querySelector<HTMLElement>('.raise')!;
    expect(raise.getAttribute('aria-label')).toBe('Sell one more Crawlid');
    press(raise);
    expect(cart.quantityFor(crawlid, 'sell')).toBe(3);
    expect(effect('FC-1')).toBe('+3');
    expect(total('net')).toBe('+3');
    expect(total('after')).toBe('53');
    expect(text(confirm())).toBe('Confirm+3');
    expect(announced()).toBe('3 Crawlid pending for sale.');

    // Every copy held is now pending, and the press that got there kept focus.
    expect(unavailable(raise)).toBe(true);
    expect(raise.getAttribute('title')).toBe('Every copy you hold is pending');
    expect(document.activeElement).toBe(raise);
    press(raise);
    expect(cart.quantityFor(crawlid, 'sell')).toBe(3);
  });

  it('bounds a purchase at 99', async () => {
    await open({}, () => cart.setQuantity(crawlid, 'buy', 99));
    const raise = line('FC-1').querySelector<HTMLElement>('.raise')!;
    expect(unavailable(raise)).toBe(true);
    press(raise);
    expect(cart.count()).toBe(99);
  });

  // ─── Typed quantities ─────────────────────────────────────────────────────

  const field = (slug: string) => line(slug).querySelector<HTMLInputElement>('.value')!;

  function type(slug: string, value: string): void {
    field(slug).focus();
    field(slug).value = value;
    field(slug).dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
  }

  function pressIn(node: HTMLElement, name: string): void {
    node.dispatchEvent(
      new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();
  }

  it('takes a typed quantity on Enter, with everything following', async () => {
    await open({ rosaries: 50 }, () => cart.setQuantity(crawlid, 'buy', 1));
    expect(field('FC-1').getAttribute('aria-label')).toBe('Copies of Crawlid to buy');
    type('FC-1', '12');
    expect(cart.count()).toBe(1);
    pressIn(field('FC-1'), 'Enter');
    expect(effect('FC-1')).toBe('−48');
    expect(total('net')).toBe('−48');
    expect(text(confirm())).toBe('Confirm−48');
    expect(cart.quantityFor(crawlid, 'buy')).toBe(12);
    expect(announced()).toBe('12 Crawlid pending for purchase.');
    expect(closed).toBe(0);
    expect(document.activeElement).toBe(field('FC-1'));
  });

  it('bounds a typed quantity on leaving the field', async () => {
    await open({ collection: [held(7, 3)] }, () => {
      cart.setQuantity(crawlid, 'buy', 1);
      cart.setQuantity(vengefly, 'sell', 3);
    });
    type('FC-1', '200');
    field('FC-1').blur();
    fixture.detectChanges();
    expect(field('FC-1').value).toBe('99');

    type('FC-7', '50');
    field('FC-7').blur();
    fixture.detectChanges();
    expect(field('FC-7').value).toBe('3');
    // Clamped back to what it was, which is not a change.
    expect(announced()).toBe('99 Crawlid pending for purchase.');
  });

  it('reads a typed zero as one, keeping the row', async () => {
    await open({}, () => cart.setQuantity(crawlid, 'buy', 4));
    type('FC-1', '0');
    pressIn(field('FC-1'), 'Enter');
    expect(lines()).toHaveLength(1);
    expect(field('FC-1').value).toBe('1');
    type('FC-1', '0');
    pressIn(field('FC-1'), 'Enter');
    expect(field('FC-1').value).toBe('1');
    expect(cart.count()).toBe(1);
  });

  it('abandons an edit on Escape before it closes', async () => {
    await open({}, () => cart.setQuantity(crawlid, 'buy', 2));
    type('FC-1', '7');
    pressIn(field('FC-1'), 'Escape');
    expect(field('FC-1').value).toBe('2');
    expect(closed).toBe(0);
    pressIn(field('FC-1'), 'Escape');
    expect(closed).toBe(1);
    expect(cart.quantityFor(crawlid, 'buy')).toBe(2);
  });

  it('counts a typed quantity before confirming', async () => {
    await open({ rosaries: 4 }, () => cart.setQuantity(crawlid, 'buy', 1));
    expect(unavailable(confirm())).toBe(false);
    type('FC-1', '9');
    // As a press does: focus leaves the field, and then the control is activated.
    confirm().focus();
    confirm().click();
    fixture.detectChanges();
    expect(confirmed).toBe(0);
    expect(cart.quantityFor(crawlid, 'buy')).toBe(9);
    expect(unavailable(confirm())).toBe(true);
  });

  it('accents a purchase and a sale apart', async () => {
    await open({ collection: [held(7, 1)] }, () => {
      cart.setQuantity(crawlid, 'buy', 1);
      cart.setQuantity(vengefly, 'sell', 1);
    });
    const bar = (slug: string) => line(slug).querySelector('.hk-seg')!;
    expect(bar('FC-1').classList).toContain('soul');
    expect(bar('FC-7').classList).not.toContain('soul');
  });

  it('words an amount of one in the singular', async () => {
    await open({ collection: [held(1, 1)] }, () => cart.setQuantity(crawlid, 'sell', 1));
    expect(line('FC-1').querySelector('.line-effect .sr-only')!.textContent).toBe('gains 1 Rosary');
    expect(confirm().getAttribute('aria-label')).toBe('Confirm, gain 1 Rosary');
  });

  it('stops lowering at one', async () => {
    await open({ collection: [held(1, 3)] }, () => cart.setQuantity(crawlid, 'sell', 2));
    const lower = line('FC-1').querySelector<HTMLElement>('.lower')!;
    press(lower);
    expect(unavailable(lower)).toBe(true);
    press(lower);
    expect(cart.quantityFor(crawlid, 'sell')).toBe(1);
    expect(lines()).toHaveLength(1);
  });

  it('removes a row, moving focus to the next, else the previous, else the close control', async () => {
    await open({ collection: [held(1, 1)] }, () => {
      cart.setQuantity(crawlid, 'sell', 1);
      cart.setQuantity(gruzMother, 'buy', 1);
      cart.setQuantity(vengefly, 'buy', 2);
    });
    const removal = (slug: string) => q(`[data-remove="${slug}"]`);
    expect(removal('FC-1').getAttribute('aria-label')).toBe('Remove Crawlid');

    press(removal('FC-1'));
    await fixture.whenStable();
    expect(lines().map((row) => row.dataset['line'])).toEqual(['FC-2', 'FC-7']);
    expect(total('net')).toBe('−35');
    expect(announced()).toBe('0 Crawlid pending for sale.');
    expect(document.activeElement).toBe(removal('FC-2'));

    press(removal('FC-7'));
    await fixture.whenStable();
    expect(document.activeElement).toBe(removal('FC-2'));

    press(removal('FC-2'));
    await fixture.whenStable();
    expect(q('.cart-empty')).not.toBeNull();
    expect(document.activeElement).toBe(q('.cart-close'));
    expect(closed).toBe(0);
  });

  it('warns in visible text, following the quantity', async () => {
    await open({ collection: [held(1, 3)], decks: [[ref(1), ref(1)], [ref(1)]] }, () =>
      cart.setQuantity(crawlid, 'sell', 1),
    );
    const warning = () => line('FC-1').querySelector('.line-warning');
    expect(warning()).toBeNull();
    press(line('FC-1').querySelector<HTMLElement>('.raise')!);
    expect(warning()!.textContent!.trim()).toBe('Removes it from Deck 1');
    expect(warning()!.querySelector('.warn-mark')).not.toBeNull();
    press(line('FC-1').querySelector<HTMLElement>('.raise')!);
    expect(warning()!.textContent!.trim()).toBe('Removes it from Deck 1 and Deck 2');
  });

  // ─── Totals and confirm ───────────────────────────────────────────────────

  it('states a gain', async () => {
    await open({ rosaries: 50, collection: [held(5, 3)] }, () =>
      cart.setQuantity(aspidMother, 'sell', 3),
    );
    expect([total('balance'), total('net'), total('after')]).toEqual(['50', '+9', '59']);
    expect(text(confirm())).toBe('Confirm+9');
    expect(confirm().querySelector('img.rosary-mark')).not.toBeNull();
    expect(confirm().getAttribute('aria-label')).toBe('Confirm, gain 9 Rosaries');
    press(confirm());
    expect(confirmed).toBe(1);
    // It asks; the page that opened it settles.
    expect(users.rosaries()).toBe(50);
  });

  it('states a spend that sales pay part of', async () => {
    await open({ rosaries: 50, collection: [held(5, 3)] }, () => {
      cart.setQuantity(aspidMother, 'sell', 3);
      cart.setQuantity(crawlid, 'buy', 5);
    });
    expect([total('balance'), total('net'), total('after')]).toEqual(['50', '−11', '39']);
    expect(text(confirm())).toBe('Confirm−11');
    expect(confirm().getAttribute('aria-label')).toBe('Confirm, spend 11 Rosaries');
    expect(unavailable(confirm())).toBe(false);
  });

  it('can confirm a net of zero', async () => {
    await open({ collection: [held(1, 10)] }, () => {
      cart.setQuantity(crawlid, 'sell', 4);
      cart.setQuantity(vengefly, 'buy', 1);
    });
    expect(total('net')).toBe('0');
    expect(text(confirm())).toBe('Confirm0');
    expect(confirm().getAttribute('aria-label')).toBe('Confirm, no Rosaries gained or spent');
    press(confirm());
    expect(confirmed).toBe(1);
  });

  it('can confirm a net of exactly the balance', async () => {
    await open({ rosaries: 4 }, () => cart.setQuantity(crawlid, 'buy', 1));
    expect(total('after')).toBe('0');
    expect(unavailable(confirm())).toBe(false);
    expect(confirm().getAttribute('title')).toBeNull();
  });

  it('states a shortfall in place of the balance after, and withholds confirm', async () => {
    await open({ rosaries: 20 }, () => cart.setQuantity(gruzMother, 'buy', 1));
    expect(q('[data-total="short"] dt').textContent).toBe('Short by');
    expect(total('short')).toBe('7');
    expect(total('after')).toBeNull();

    expect(confirm().disabled).toBe(false);
    expect(unavailable(confirm())).toBe(true);
    expect(confirm().getAttribute('title')).toBe('Not enough Rosaries');
    expect(described(confirm())).toBe('Not enough Rosaries');
    press(confirm());
    expect(document.activeElement).toBe(confirm());
    expect(confirmed).toBe(0);
    expect(cart.count()).toBe(1);
  });

  it('makes confirm available as soon as the cart is affordable', async () => {
    await open({ rosaries: 4 }, () => cart.setQuantity(crawlid, 'buy', 2));
    expect(unavailable(confirm())).toBe(true);
    press(line('FC-1').querySelector<HTMLElement>('.lower')!);
    expect(unavailable(confirm())).toBe(false);
    expect(total('after')).toBe('0');
  });

  it('cannot confirm an empty cart', async () => {
    await open({ rosaries: 500 });
    expect(unavailable(confirm())).toBe(true);
    expect(confirm().getAttribute('title')).toBe('The cart is empty');
    expect(described(confirm())).toBe('The cart is empty');
    press(confirm());
    expect(confirmed).toBe(0);
  });

  // ─── Modal behaviour ──────────────────────────────────────────────────────

  const key = (name: string, shiftKey = false) =>
    q('.cart').dispatchEvent(new KeyboardEvent('keydown', { key: name, shiftKey, bubbles: true }));

  it('is a modal dialog named Cart, opening with focus on its close control', async () => {
    await open({});
    expect(q('.cart').getAttribute('role')).toBe('dialog');
    expect(q('.cart').getAttribute('aria-modal')).toBe('true');
    expect(q(`#${q('.cart').getAttribute('aria-labelledby')}`).textContent).toBe('Cart');
    expect(document.activeElement).toBe(q('.cart-close'));
  });

  it('closes on its control, on Escape, and on the area outside, confirming nothing', async () => {
    await open({ rosaries: 100 }, () => cart.setQuantity(crawlid, 'buy', 1));
    press(q('.cart-close'));
    expect(closed).toBe(1);
    key('Escape');
    expect(closed).toBe(2);
    q('.cart-scrim').click();
    expect(closed).toBe(3);
    expect(confirmed).toBe(0);
    expect(cart.count()).toBe(1);
  });

  it('holds Tab inside, unavailable controls included', async () => {
    await open({}, () => cart.setQuantity(crawlid, 'buy', 1));
    expect(unavailable(confirm())).toBe(true);
    confirm().focus();
    key('Tab');
    expect(document.activeElement).toBe(q('.cart-close'));
    key('Tab', true);
    expect(document.activeElement).toBe(confirm());

    // A row's field is a stop like any other, so leaving it is left to the browser.
    field('FC-1').focus();
    key('Tab');
    expect(document.activeElement).toBe(field('FC-1'));
    key('Tab', true);
    expect(document.activeElement).toBe(field('FC-1'));

    // From the dialog's own ground, back to its first control.
    q('.cart').focus();
    key('Tab');
    expect(document.activeElement).toBe(q('.cart-close'));
  });

  it('gives focus back to whatever opened it', async () => {
    const opener = document.createElement('button');
    document.body.appendChild(opener);
    opener.focus();
    await open({});
    expect(document.activeElement).not.toBe(opener);
    fixture.destroy();
    await Promise.resolve();
    expect(document.activeElement).toBe(opener);
    opener.remove();
  });

  it('says nothing on opening, and announces from its own region', async () => {
    await open({ collection: [held(1, 2)] }, () => cart.setQuantity(crawlid, 'sell', 1));
    expect(q('[data-testid="cart-announcement"]').getAttribute('aria-live')).toBe('polite');
    expect(announced()).toBe('');
    press(line('FC-1').querySelector<HTMLElement>('.raise')!);
    expect(announced()).toBe('2 Crawlid pending for sale.');
  });
});
