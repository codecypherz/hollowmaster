import { ComponentFixture, TestBed } from '@angular/core/testing';
import { addSixStarCard } from '../../testing/six-star';
import { CARD_BY_KEY, CARD_DB, cardKeyOf } from '../../model/card';
import { NO_MILESTONES, PersistedUser, SCHEMA_VERSION, quantityOf } from '../../model/user';
import { USER_STORE, UserStore } from '../../services/user-store';
import { CartService } from '../../services/cart.service';
import { UserService } from '../../services/user.service';
import { Collection, summaryText } from './collection';

const crawlid = CARD_BY_KEY.get(cardKeyOf('FC', 1))!; // one star, 4 to buy, 1 to sell
const vengefly = CARD_BY_KEY.get(cardKeyOf('FC', 3))!;
const FC_TOTAL = CARD_DB.filter((card) => card.set === 'FC').length;

type Ref = { set: string; number: number };

/** A store holding one record, so a test can start from any user it states. */
function storeWith(record: Partial<PersistedUser> | null): UserStore {
  return {
    load: async () =>
      record && {
        version: SCHEMA_VERSION,
        geo: 0,
        rosaries: 0,
        collection: [],
        decks: [],
        battleDeck: null,
        milestones: NO_MILESTONES,
        ...record,
      },
    save: async () => {},
  };
}

describe('the Collection page', () => {
  let fixture: ComponentFixture<Collection>;
  let users: UserService;
  let cart: CartService;
  let el: HTMLElement;

  async function open(record: Partial<PersistedUser> | null = null): Promise<void> {
    TestBed.configureTestingModule({
      providers: [{ provide: USER_STORE, useValue: storeWith(record) }],
    });
    users = TestBed.inject(UserService);
    cart = TestBed.inject(CartService);
    await users.load();
    fixture = TestBed.createComponent(Collection);
    el = fixture.nativeElement;
    document.body.appendChild(el);
    fixture.detectChanges();
    await fixture.whenStable();
  }

  afterEach(() => el.remove());

  function render(): void {
    fixture.detectChanges();
  }

  /** Presses a control the way a player does, so it also holds focus. */
  function press(control: HTMLElement, times = 1): void {
    control.focus();
    for (let i = 0; i < times; i++) {
      control.click();
      render();
    }
  }

  const held = (number: number, quantity: number) => ({ set: 'FC', number, quantity });
  const ref = (number: number): Ref => ({ set: 'FC', number });

  const tile = (slug: string) => el.querySelector<HTMLElement>(`.tile[data-card="${slug}"]`)!;
  const row = (slug: string, action: 'sell' | 'buy') =>
    el.querySelector<HTMLElement>(`[data-row="${action}-${slug}"]`)!;
  const part = (slug: string, action: 'sell' | 'buy', name: 'lower' | 'raise' | 'target') =>
    row(slug, action).querySelector<HTMLButtonElement>(`.${name}`)!;
  const amount = (slug: string, action: 'sell' | 'buy') => Number(field(slug, action).value);
  const field = (slug: string, action: 'sell' | 'buy') =>
    row(slug, action).querySelector<HTMLInputElement>('.value')!;
  const unavailable = (control: HTMLElement) => control.getAttribute('aria-disabled') === 'true';
  const badge = (slug: string) => tile(slug).querySelector('.badge')!.getAttribute('aria-label');
  const progress = () =>
    el.querySelector('.set-section:first-child .set-progress .sr-only')!.textContent!.trim();
  const cartControl = () => el.querySelector<HTMLButtonElement>('[data-testid="cart-control"]')!;
  const dialog = () => el.querySelector<HTMLElement>('app-cart-dialog [role="dialog"]');
  const within = (selector: string) => dialog()!.querySelector<HTMLElement>(selector)!;

  /** What assistive technology is told about an element, from its description. */
  const described = (node: HTMLElement) =>
    (node.getAttribute('aria-describedby') ?? '')
      .split(' ')
      .filter(Boolean)
      .map((id) => el.querySelector(`#${id}`)!.textContent!.trim());

  const purse = () => el.querySelector('[data-testid="rosary-purse"] .rosary-value')!.textContent;
  const announced = () =>
    el.querySelector('[data-testid="exchange-announcement"]')!.textContent!.trim();

  // ─── Frame ────────────────────────────────────────────────────────────────

  it('is headed Collection, keeps its atmosphere, and draws no corner frame', async () => {
    await open();
    expect(el.querySelector('h1.screen-header-title')!.textContent!.trim()).toBe('Collection');
    for (const part of ['.void-bg', '.mist-layer', '.particles .particle']) {
      expect(el.querySelector(part), part).not.toBeNull();
    }
    expect(el.querySelectorAll('.corner')).toHaveLength(0);
  });

  it('shows a zero purse as zero, named as Rosaries', async () => {
    await open();
    expect(purse()).toBe('0');
    expect(el.querySelector('.purse')!.getAttribute('aria-label')).toBe('Your Rosaries, 0');
    expect(el.querySelector('.purse img.rosary-mark')!.getAttribute('alt')).toBe('Rosaries');
  });

  // ─── Sections ─────────────────────────────────────────────────────────

  it('presents one section per named set, in order, the empty ones forthcoming', async () => {
    await open();
    const heads = [...el.querySelectorAll('.set-section .set-head')];
    expect(heads.map((h) => h.querySelector('.set-name')!.textContent!.trim())).toEqual([
      'Forgotten Crossroads',
      'Greenpath',
      'City of Tears',
    ]);
    const sections = [...el.querySelectorAll('.set-section')];
    for (const [i, section] of sections.entries()) {
      expect(section.getAttribute('aria-labelledby')).toBe(heads[i].id);
    }
    for (const section of sections.slice(1)) {
      expect(section.querySelector('.set-progress')!.textContent!.trim()).toBe('Forthcoming');
      expect(section.querySelectorAll('.tile, button')).toHaveLength(0);
    }
  });

  it('shows every card of the set in set-number order, owned or not', async () => {
    await open({ collection: [held(1, 1)] });
    const slugs = [...el.querySelectorAll('.set-section:first-child .tile')].map((t) =>
      t.getAttribute('data-card'),
    );
    expect(slugs).toHaveLength(FC_TOTAL);
    const numbers = slugs.map((slug) => Number(slug!.split('-')[1]));
    expect(numbers).toEqual([...numbers].sort((a, b) => a - b));
  });

  it('states progress as distinct cards held, in figures and in words', async () => {
    await open({ collection: [held(1, 3)] });
    const progress = el.querySelector('.set-section:first-child .set-progress')!;
    expect(progress.querySelector('[aria-hidden="true"]')!.textContent!.trim()).toBe(
      `1 / ${FC_TOTAL}`,
    );
    expect(progress.querySelector('.sr-only')!.textContent!.trim()).toBe(
      `1 of ${FC_TOTAL} collected`,
    );
  });

  // ─── Badges ───────────────────────────────────────────────────────────

  it('badges a held card with its count and an unowned one as not owned', async () => {
    await open({ collection: [held(1, 3), held(3, 1)] });
    const face = (slug: string) => tile(slug).querySelector('.badge')!.textContent!.trim();
    expect(badge('FC-1')).toBe('3 held');
    expect(face('FC-1')).toBe('3 held');
    expect(badge('FC-3')).toBe('1 held');
    expect(badge('FC-6')).toBe('Not owned');
    expect(face('FC-6')).toBe('Not owned');
    expect(tile('FC-6').querySelector('.veil')).not.toBeNull();
    expect(tile('FC-1').querySelector('.veil')).toBeNull();
  });

  // ─── The frame ────────────────────────────────────────────────────────

  it('frames each card: number, card and badge, Sell row, Buy row', async () => {
    await open({ collection: [held(1, 2)] });
    const parts = [...tile('FC-1').querySelectorAll('.tile-number, app-card, .badge, .row')];
    const named = parts.map(
      (node) =>
        node.getAttribute('data-row') ?? (node.matches('app-card') ? 'card' : node.className),
    );
    expect(named).toEqual(['tile-number', 'card', 'badge', 'sell-FC-1', 'buy-FC-1']);
  });

  it('shows the collection number unpadded and keeps it, and the rows, off the card', async () => {
    await open();
    expect(tile('FC-1').querySelector('.tile-number')!.textContent!.trim()).toBe('FC#1');
    expect(tile('FC-10').querySelector('.tile-number')!.textContent!.trim()).toBe('FC#10');
    expect(tile('FC-1').querySelector('.tile-card .tile-number, .tile-card .row')).toBeNull();
    // The veil covers the card and nothing else of the frame.
    expect(tile('FC-6').querySelector('.veil')!.parentElement!.className).toBe('tile-card');
  });

  // ─── The Sell row ─────────────────────────────────────────────────────

  it('presents both rows for every card, named for it', async () => {
    await open();
    expect(el.querySelectorAll('.tile .row')).toHaveLength(FC_TOTAL * 2);
    for (const [action, label] of [
      ['sell', 'Sell'],
      ['buy', 'Buy'],
    ] as const) {
      const group = row('FC-1', action);
      expect(group.getAttribute('role')).toBe('group');
      expect(group.getAttribute('aria-label')).toBe(`${label} Crawlid`);
      expect(group.querySelector('.row-label')!.textContent!.trim()).toBe(label);
      expect(amount('FC-1', action)).toBe(0);
    }
    expect(part('FC-1', 'sell', 'lower').getAttribute('aria-label')).toBe('Sell one fewer Crawlid');
    expect(part('FC-1', 'sell', 'raise').getAttribute('aria-label')).toBe('Sell one more Crawlid');
    expect(part('FC-1', 'sell', 'target').getAttribute('aria-label')).toBe(
      'Sell down to 9 Crawlid',
    );
    expect(part('FC-1', 'sell', 'target').textContent!.trim()).toBe('↓9');
    expect(part('FC-1', 'buy', 'lower').getAttribute('aria-label')).toBe('Buy one fewer Crawlid');
    expect(part('FC-1', 'buy', 'raise').getAttribute('aria-label')).toBe('Buy one more Crawlid');
    expect(part('FC-1', 'buy', 'target').getAttribute('aria-label')).toBe('Buy up to 9 Crawlid');
    expect(part('FC-1', 'buy', 'target').textContent!.trim()).toBe('↑9');
  });

  const price = (slug: string, action: 'sell' | 'buy') =>
    row(slug, action).querySelector('.row-price .rosary-value')?.textContent ?? null;

  it('shows each price under its label and, in words, tells assistive technology', async () => {
    await open();
    const first = (stars: number) => CARD_DB.find((card) => card.stars === stars);
    for (const [stars, sell, buy] of [
      [1, 1, 4],
      [2, 3, 12],
      [3, 9, 27],
      [4, 33, 99],
      [5, 330, 660],
    ]) {
      const card = first(stars);
      if (!card) continue;
      const slug = `FC-${card.number}`;
      expect(price(slug, 'sell')).toBe(String(sell));
      expect(price(slug, 'buy')).toBe(String(buy));
      expect(described(row(slug, 'buy'))).toEqual([`${buy} Rosaries each`]);
      expect(row(slug, 'sell').getAttribute('title')).toBeNull();
    }
    expect(described(row('FC-1', 'sell'))).toEqual(['1 Rosary each']);
    expect(described(row('FC-8', 'sell'))).toEqual(['3 Rosaries each']);
    expect(row('FC-8', 'sell').querySelector('.row-price')!.getAttribute('aria-hidden')).toBe(
      'true',
    );
    expect(row('FC-8', 'sell').querySelector('.row-price img.rosary-mark')).not.toBeNull();
  });

  it('draws each row as one segmented bar, the Buy row in soul', async () => {
    await open();
    for (const action of ['sell', 'buy'] as const) {
      const bar = row('FC-1', action).querySelector('.hk-seg')!;
      const segments = [...bar.querySelectorAll(':scope > button, :scope > input')];
      expect(segments.map((node) => node.className.split(' ').at(-1))).toEqual([
        'lower',
        'value',
        'raise',
        'target',
      ]);
      expect(bar.classList.contains('soul')).toBe(action === 'buy');
    }
  });

  it('shows and announces no price it does not know, and cannot buy there', async () => {
    addSixStarCard();
    await open();
    const slug = 'FC-900';
    for (const action of ['sell', 'buy'] as const) {
      expect(price(slug, action)).toBeNull();
      expect(row(slug, action).querySelector('.row-price')).not.toBeNull();
      expect(described(row(slug, action))).toEqual([]);
    }
    for (const name of ['lower', 'raise', 'target'] as const) {
      expect(unavailable(part(slug, 'buy', name)), name).toBe(true);
      press(part(slug, 'buy', name));
    }
    expect(amount(slug, 'buy')).toBe(0);
    expect(cart.isEmpty()).toBe(true);
    for (const name of ['raise', 'target'] as const) {
      expect(part(slug, 'buy', name).title).toBe('You do not know its price yet');
      expect(described(part(slug, 'buy', name))).toEqual(['You do not know its price yet']);
    }
    expect(field(slug, 'buy').readOnly).toBe(true);
    expect(described(field(slug, 'buy'))).toEqual(['You do not know its price yet']);
    expect(tile(slug).textContent).not.toMatch(/5000|9999/);
  });

  it('shows the price and offers the purchase once the rate is earned', async () => {
    addSixStarCard();
    await open({ rosaries: 9998, collection: [held(1, 1)] });
    expect(price('FC-900', 'buy')).toBeNull();
    users.settle([{ key: cardKeyOf('FC', 1), action: 'sell', quantity: 1 }]);
    render();
    expect(price('FC-900', 'sell')).toBe('5000');
    expect(price('FC-900', 'buy')).toBe('9999');
    expect(described(row('FC-900', 'buy'))).toEqual(['9999 Rosaries each']);
    press(part('FC-900', 'buy', 'raise'));
    expect(amount('FC-900', 'buy')).toBe(1);
  });

  it('steps the pending sale up and down', async () => {
    await open({ collection: [held(1, 3)] });
    press(part('FC-1', 'sell', 'raise'), 2);
    press(part('FC-1', 'sell', 'lower'));
    expect(amount('FC-1', 'sell')).toBe(1);
    press(part('FC-1', 'sell', 'lower'));
    expect(amount('FC-1', 'sell')).toBe(0);
    expect(unavailable(part('FC-1', 'sell', 'lower'))).toBe(true);
    expect(cart.isEmpty()).toBe(true);
  });

  it('bounds the sale by the copies held, keeping focus at the bound', async () => {
    await open({ collection: [held(1, 2)] });
    const raise = part('FC-1', 'sell', 'raise');
    press(raise, 2);
    expect(amount('FC-1', 'sell')).toBe(2);
    expect(unavailable(raise)).toBe(true);
    expect(raise.disabled).toBe(false);
    expect(raise.getAttribute('title')).toBe('Every copy you hold is pending');
    expect(described(raise)).toEqual(['Every copy you hold is pending']);
    expect(document.activeElement).toBe(raise);
    press(raise);
    expect(amount('FC-1', 'sell')).toBe(2);
  });

  it('sells down to nine from the copies held, replacing what is pending', async () => {
    await open({ collection: [held(1, 14)] });
    const target = part('FC-1', 'sell', 'target');
    expect(unavailable(target)).toBe(false);
    press(target);
    expect(amount('FC-1', 'sell')).toBe(5);
    press(part('FC-1', 'sell', 'raise'), 3);
    expect(amount('FC-1', 'sell')).toBe(8);
    press(target);
    expect(amount('FC-1', 'sell')).toBe(5);
  });

  it('withholds selling down at nine copies or fewer, with the reason', async () => {
    await open({ collection: [held(1, 9), held(3, 2)] });
    for (const slug of ['FC-1', 'FC-3', 'FC-6']) {
      const target = part(slug, 'sell', 'target');
      expect(unavailable(target), slug).toBe(true);
      expect(target.disabled).toBe(false);
      expect(target.getAttribute('title')).toBe('You hold 9 or fewer');
      expect(described(target)).toEqual(['You hold 9 or fewer']);
      press(target);
      expect(amount(slug, 'sell')).toBe(0);
      expect(document.activeElement).toBe(target);
    }
  });

  it('leaves every control of an unowned card’s Sell row unavailable', async () => {
    await open({ collection: [held(1, 1)] });
    expect(amount('FC-6', 'sell')).toBe(0);
    for (const name of ['lower', 'raise', 'target'] as const) {
      expect(unavailable(part('FC-6', 'sell', name)), name).toBe(true);
      press(part('FC-6', 'sell', name));
    }
    expect(part('FC-6', 'sell', 'raise').getAttribute('title')).toBe('You hold none to sell');
    expect(cart.isEmpty()).toBe(true);
  });

  // ─── The Buy row ──────────────────────────────────────────────────────

  it('steps the pending purchase, unlimited by the balance', async () => {
    await open({ rosaries: 0 });
    press(part('FC-1', 'buy', 'raise'), 3);
    press(part('FC-1', 'buy', 'lower'));
    expect(amount('FC-1', 'buy')).toBe(2);
    expect(unavailable(part('FC-6', 'buy', 'lower'))).toBe(true);
  });

  it('buys up to nine from the copies held', async () => {
    await open({ collection: [held(1, 2)] });
    press(part('FC-1', 'buy', 'target'));
    expect(amount('FC-1', 'buy')).toBe(7);
    press(part('FC-6', 'buy', 'target'));
    expect(amount('FC-6', 'buy')).toBe(9);
    press(part('FC-6', 'buy', 'raise'));
    press(part('FC-6', 'buy', 'target'));
    expect(amount('FC-6', 'buy')).toBe(9);
  });

  it('withholds buying up at nine copies or more, with the reason', async () => {
    await open({ collection: [held(1, 9), held(3, 14)] });
    for (const slug of ['FC-1', 'FC-3']) {
      const target = part(slug, 'buy', 'target');
      expect(unavailable(target), slug).toBe(true);
      expect(target.getAttribute('title')).toBe('You hold 9 or more');
      expect(described(target)).toEqual(['You hold 9 or more']);
      press(target);
      expect(amount(slug, 'buy')).toBe(0);
    }
  });

  it('bounds the purchase at 99, with the reason', async () => {
    await open();
    cart.setQuantity(crawlid, 'buy', 99);
    render();
    const raise = part('FC-1', 'buy', 'raise');
    expect(unavailable(raise)).toBe(true);
    expect(raise.getAttribute('title')).toBe('99 is the most that can be pending');
    press(raise);
    expect(amount('FC-1', 'buy')).toBe(99);
  });

  it('keeps the rows exclusive of each other', async () => {
    await open({ collection: [held(1, 5)] });
    press(part('FC-1', 'buy', 'raise'), 3);
    press(part('FC-1', 'sell', 'raise'));
    expect(amount('FC-1', 'sell')).toBe(1);
    expect(amount('FC-1', 'buy')).toBe(0);
  });

  // ─── Typed quantities ─────────────────────────────────────────────────

  function type(slug: string, action: 'sell' | 'buy', value: string): void {
    field(slug, action).focus();
    field(slug, action).value = value;
    field(slug, action).dispatchEvent(new Event('input', { bubbles: true }));
    render();
  }

  function pressIn(node: HTMLElement, key: string): void {
    node.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    render();
  }

  it('names each field for its direction and card', async () => {
    await open({ collection: [held(1, 1)] });
    expect(field('FC-1', 'sell').getAttribute('aria-label')).toBe('Copies of Crawlid to sell');
    expect(field('FC-1', 'buy').getAttribute('aria-label')).toBe('Copies of Crawlid to buy');
  });

  it('takes a typed purchase on Enter, and announces it', async () => {
    await open();
    type('FC-1', 'buy', '25');
    expect(cart.count()).toBe(0);
    expect(announced()).toBe('');
    pressIn(field('FC-1', 'buy'), 'Enter');
    expect(amount('FC-1', 'buy')).toBe(25);
    expect(cart.quantityFor(crawlid, 'buy')).toBe(25);
    expect(announced()).toBe('25 Crawlid pending for purchase.');
  });

  it('takes a typed purchase on leaving the field', async () => {
    await open();
    type('FC-1', 'buy', '4');
    field('FC-1', 'buy').blur();
    expect(cart.quantityFor(crawlid, 'buy')).toBe(4);
  });

  it('brings a quantity beyond the bound to the bound, again and again', async () => {
    await open({ collection: [held(1, 3)] });
    for (let i = 0; i < 2; i++) {
      type('FC-1', 'sell', '50');
      pressIn(field('FC-1', 'sell'), 'Enter');
      expect(amount('FC-1', 'sell')).toBe(3);
    }
    type('FC-1', 'buy', '1000');
    pressIn(field('FC-1', 'buy'), 'Enter');
    expect(amount('FC-1', 'buy')).toBe(99);
  });

  it('announces nothing for a typed quantity that changes nothing', async () => {
    await open({ collection: [held(1, 3)] });
    type('FC-1', 'sell', '3');
    pressIn(field('FC-1', 'sell'), 'Enter');
    press(part('FC-3', 'buy', 'raise'));
    expect(announced()).toBe('1 Vengefly pending for purchase.');
    type('FC-1', 'sell', '50');
    pressIn(field('FC-1', 'sell'), 'Enter');
    expect(announced()).toBe('1 Vengefly pending for purchase.');
  });

  it('excludes the other row, and takes the line out at zero', async () => {
    await open({ collection: [held(1, 2)] });
    press(part('FC-1', 'buy', 'raise'), 3);
    type('FC-1', 'sell', '1');
    pressIn(field('FC-1', 'sell'), 'Enter');
    expect(amount('FC-1', 'sell')).toBe(1);
    expect(amount('FC-1', 'buy')).toBe(0);

    type('FC-1', 'sell', '0');
    pressIn(field('FC-1', 'sell'), 'Enter');
    expect(cart.isEmpty()).toBe(true);
  });

  it('has the deck warning follow a typed sale', async () => {
    await open({ collection: [held(1, 3)], decks: [[ref(1), ref(1)]] });
    type('FC-1', 'sell', '2');
    pressIn(field('FC-1', 'sell'), 'Enter');
    expect(row('FC-1', 'sell').querySelector('.warn')).not.toBeNull();
  });

  it('keeps the quantity when the field is emptied or the edit abandoned', async () => {
    await open();
    press(part('FC-1', 'buy', 'raise'), 3);
    type('FC-1', 'buy', '');
    field('FC-1', 'buy').blur();
    render();
    expect(amount('FC-1', 'buy')).toBe(3);

    type('FC-1', 'buy', '8');
    pressIn(field('FC-1', 'buy'), 'Escape');
    expect(amount('FC-1', 'buy')).toBe(3);
    expect(cart.quantityFor(crawlid, 'buy')).toBe(3);
  });

  it('carries the plus control on from what was typed', async () => {
    await open();
    type('FC-1', 'buy', '5');
    press(part('FC-1', 'buy', 'raise'));
    expect(amount('FC-1', 'buy')).toBe(6);
  });

  it('cannot be typed in where nothing could be pending, but says why', async () => {
    await open();
    const sale = field('FC-6', 'sell');
    expect(sale.value).toBe('0');
    expect(sale.readOnly).toBe(true);
    expect(sale.title).toBe('You hold none to sell');
    expect(described(sale)).toEqual(['You hold none to sell']);
    sale.focus();
    expect(document.activeElement).toBe(sale);
    // A purchase that has reached its bound is still there to be lowered.
    cart.setQuantity(crawlid, 'buy', 99);
    render();
    expect(field('FC-1', 'buy').readOnly).toBe(false);
  });

  // ─── Reading ──────────────────────────────────────────────────────────

  const reader = () => el.querySelector<HTMLElement>('app-card-reader');
  const cardOf = (slug: string) =>
    tile(slug).querySelector<HTMLButtonElement>('.tile-card button')!;

  it('reads an owned and an unowned card, offering only to close', async () => {
    await open({ collection: [held(1, 1)] });
    for (const [slug, name] of [
      ['FC-1', 'Crawlid'],
      ['FC-6', 'Gruz Mother'],
    ]) {
      expect(cardOf(slug).getAttribute('aria-haspopup')).toBe('dialog');
      expect(cardOf(slug).getAttribute('aria-pressed')).toBeNull();
      press(cardOf(slug));
      expect(reader()!.getAttribute('aria-label')).toBe(`Reading ${name}`);
      expect(reader()!.querySelector('.veil')).toBeNull();
      const controls = [...reader()!.querySelectorAll('button')];
      expect(controls.map((control) => control.textContent!.trim())).toEqual(['Close']);
      expect(document.activeElement).toBe(controls[0]);

      reader()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      render();
      await Promise.resolve();
      expect(reader()).toBeNull();
      expect(document.activeElement).toBe(cardOf(slug));
    }
  });

  it('changes neither the user nor the cart by reading', async () => {
    await open({ collection: [held(1, 2)] });
    press(part('FC-1', 'sell', 'raise'));
    const [state, lines] = [users.state(), cart.lines()];
    press(cardOf('FC-1'));
    press(reader()!.querySelector<HTMLElement>('button')!);
    expect(users.state()).toBe(state);
    expect(cart.lines()).toBe(lines);
  });

  it('does not read from the rows', async () => {
    await open({ collection: [held(1, 12)] });
    for (const name of ['raise', 'lower', 'target'] as const) press(part('FC-1', 'sell', name));
    field('FC-1', 'buy').click();
    render();
    expect(reader()).toBeNull();
  });

  // ─── The deck warning ─────────────────────────────────────────────────

  it('warns, naming the decks, only once the sale that trims them is pending', async () => {
    await open({
      collection: [held(1, 1), held(3, 1)],
      decks: [[ref(1)], [ref(3)], [ref(3), ref(1)]],
    });
    const sell = row('FC-1', 'sell');
    const text = 'Selling removes it from Deck 1 and Deck 3';
    expect(sell.querySelector('.warn')).toBeNull();
    expect(described(sell)).toEqual(['1 Rosary each']);

    press(part('FC-1', 'sell', 'raise'));
    expect(sell.querySelector('.warn')!.getAttribute('title')).toBe(text);
    expect(sell.querySelector('.warn .warn-mark')).not.toBeNull();
    expect(described(sell)).toEqual(['1 Rosary each', text]);
    expect(row('FC-1', 'buy').querySelector('.warn')).toBeNull();

    press(part('FC-1', 'sell', 'lower'));
    expect(sell.querySelector('.warn')).toBeNull();
  });

  it('follows the pending quantity, and keeps its slot when there is no warning', async () => {
    await open({ collection: [held(1, 3)], decks: [[ref(1), ref(1)]] });
    press(part('FC-1', 'sell', 'raise'));
    expect(row('FC-1', 'sell').querySelector('.warn')).toBeNull();
    press(part('FC-1', 'sell', 'raise'));
    expect(row('FC-1', 'sell').querySelector('.warn')!.getAttribute('title')).toBe(
      'Selling removes it from Deck 1',
    );
    expect(el.querySelectorAll('.row .warn-slot')).toHaveLength(FC_TOTAL * 2);
  });

  // ─── The cart control ─────────────────────────────────────────────────

  it('always shows the cart, counting copies in figures and in words', async () => {
    await open({ collection: [held(1, 3)] });
    const count = () => cartControl().querySelector('.cart-count')!.textContent!.trim();
    const name = () => cartControl().getAttribute('aria-label');
    expect(count()).toBe('0');
    expect(name()).toBe('Cart, no cards pending');

    press(part('FC-3', 'buy', 'raise'));
    expect(count()).toBe('1');
    expect(name()).toBe('Cart, 1 card pending');

    press(part('FC-1', 'sell', 'raise'), 2);
    expect(count()).toBe('3');
    expect(name()).toBe('Cart, 3 cards pending');
  });

  it('reaches the cart control before any tile', async () => {
    await open();
    expect([...el.querySelectorAll('button')][0]).toBe(cartControl());
  });

  // ─── Announcements ────────────────────────────────────────────────────

  it('announces each pending change without moving focus', async () => {
    await open({ rosaries: 40, collection: [held(1, 5)] });
    expect(announced()).toBe('');
    const raise = part('FC-1', 'sell', 'raise');
    press(raise, 2);
    expect(announced()).toBe('2 Crawlid pending for sale.');
    expect(document.activeElement).toBe(raise);

    const buy = part('FC-1', 'buy', 'target');
    press(buy);
    expect(announced()).toBe('4 Crawlid pending for purchase. Its pending sale was cleared.');
    expect(document.activeElement).toBe(buy);

    press(part('FC-1', 'sell', 'raise'));
    expect(announced()).toBe('1 Crawlid pending for sale. Its pending purchase was cleared.');
  });

  it('moves neither the purse, the badge, the progress, nor any user state', async () => {
    await open({ rosaries: 500, collection: [held(1, 1)], decks: [[ref(1)]] });
    const before = users.state();
    press(part('FC-1', 'sell', 'raise'));
    press(part('FC-6', 'buy', 'raise'), 2);
    expect(purse()).toBe('500');
    expect(badge('FC-1')).toBe('1 held');
    expect(badge('FC-6')).toBe('Not owned');
    expect(progress()).toBe(`1 of ${FC_TOTAL} collected`);
    expect(users.state()).toBe(before);
  });

  // ─── The cart, from the page ──────────────────────────────────────────

  it('opens the dialog from the cart control and returns focus on dismissal', async () => {
    await open({ rosaries: 500 });
    press(part('FC-1', 'buy', 'raise'));
    expect(dialog()).toBeNull();
    press(cartControl());
    expect(dialog()).not.toBeNull();
    const lines = cart.lines();

    dialog()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    render();
    await fixture.whenStable();
    expect(dialog()).toBeNull();
    expect(document.activeElement).toBe(cartControl());
    expect(users.rosaries()).toBe(500);
    expect(cart.lines()).toEqual(lines);
  });

  it('has the rows follow an adjustment made in the dialog', async () => {
    await open({ collection: [held(1, 3)] });
    press(part('FC-1', 'sell', 'raise'), 2);
    press(cartControl());
    press(within('[data-line="FC-1"] .raise'));
    expect(amount('FC-1', 'sell')).toBe(3);
    press(within('[data-remove="FC-1"]'));
    expect(amount('FC-1', 'sell')).toBe(0);
    expect(cartControl().getAttribute('aria-label')).toBe('Cart, no cards pending');
  });

  it('confirms the cart: purse, badges, progress, and decks all follow', async () => {
    await open({
      rosaries: 50,
      collection: [held(1, 6)],
      decks: [[], [ref(1)]],
    });
    press(part('FC-1', 'sell', 'raise'), 6);
    press(part('FC-3', 'buy', 'raise'));
    press(cartControl());
    press(within('.cart-confirm'));
    await fixture.whenStable();

    expect(dialog()).toBeNull();
    expect(purse()).toBe('52');
    expect(quantityOf(users.collection(), crawlid)).toBe(0);
    expect(quantityOf(users.collection(), vengefly)).toBe(1);
    expect(badge('FC-1')).toBe('Not owned');
    expect(badge('FC-3')).toBe('1 held');
    expect(progress()).toBe(`1 of ${FC_TOTAL} collected`);
    expect(users.decks()[1].cards).toEqual([]);
    expect(cart.isEmpty()).toBe(true);
    expect(amount('FC-1', 'sell')).toBe(0);
    expect(announced()).toBe('6 sold, 1 bought, 2 Rosaries gained. Cards removed from Deck 2.');
    expect(document.activeElement).toBe(cartControl());
  });

  it('does nothing, and keeps the dialog up, for a cart that cannot be afforded', async () => {
    await open({ rosaries: 3 });
    press(part('FC-1', 'buy', 'raise'));
    press(cartControl());
    press(within('.cart-confirm'));
    expect(dialog()).not.toBeNull();
    expect(users.rosaries()).toBe(3);
    expect(cart.count()).toBe(1);
  });
});

describe('a confirmed cart in words', () => {
  it('states what was sold and bought, the net, and any decks', () => {
    expect(summaryText({ sold: 2, bought: 1, net: -80, trims: ['Deck 2'] })).toBe(
      '2 sold, 1 bought, 80 Rosaries spent. Cards removed from Deck 2.',
    );
    expect(summaryText({ sold: 3, bought: 0, net: 60, trims: [] })).toBe(
      '3 sold, 0 bought, 60 Rosaries gained.',
    );
    expect(summaryText({ sold: 1, bought: 0, net: 1, trims: [] })).toBe(
      '1 sold, 0 bought, 1 Rosary gained.',
    );
    expect(summaryText({ sold: 10, bought: 1, net: 0, trims: [] })).toBe(
      '10 sold, 1 bought, no Rosaries gained or spent.',
    );
  });
});
