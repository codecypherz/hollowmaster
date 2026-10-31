import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CARD_BY_KEY, CARD_DB, cardKeyOf } from '../../model/card';
import { PersistedUser, SCHEMA_VERSION, quantityOf } from '../../model/user';
import { USER_STORE, UserStore } from '../../services/user-store';
import { UserService } from '../../services/user.service';
import { Collection, listOf } from './collection';

const crawlid = CARD_BY_KEY.get(cardKeyOf('FC', 1))!; // one star, 100 to buy, 10 to sell
const vengefly = CARD_BY_KEY.get(cardKeyOf('FC', 7))!;
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
        ...record,
      },
    save: async () => {},
  };
}

describe('the Collection page', () => {
  let fixture: ComponentFixture<Collection>;
  let page: Collection;
  let users: UserService;
  let el: HTMLElement;

  async function open(record: Partial<PersistedUser> | null = null): Promise<void> {
    TestBed.configureTestingModule({
      providers: [{ provide: USER_STORE, useValue: storeWith(record) }],
    });
    users = TestBed.inject(UserService);
    await users.load();
    fixture = TestBed.createComponent(Collection);
    page = fixture.componentInstance;
    el = fixture.nativeElement;
    fixture.detectChanges();
    await fixture.whenStable();
  }

  function render(): void {
    fixture.detectChanges();
  }

  const held = (number: number, quantity: number) => ({ set: 'FC', number, quantity });
  const ref = (number: number): Ref => ({ set: 'FC', number });

  const tile = (slug: string) => el.querySelector<HTMLElement>(`.tile[data-card="${slug}"]`)!;
  const buy = (slug: string) => el.querySelector<HTMLButtonElement>(`[data-buy="${slug}"]`)!;
  const sell = (slug: string) => el.querySelector<HTMLButtonElement>(`[data-sell="${slug}"]`);
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
    expect(el.querySelector('.purse')!.getAttribute('aria-label')).toBe('Your Rosaries');
    expect(el.querySelector('.purse img.rosary-mark')!.getAttribute('alt')).toBe('Rosaries');
  });

  // ─── 4.2 Sections ─────────────────────────────────────────────────────────

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

  // ─── 4.3 Badges ───────────────────────────────────────────────────────────

  it('badges a held card with its count and an unowned one as not owned', async () => {
    await open({ collection: [held(1, 3), held(7, 1)] });
    const badge = (slug: string) => tile(slug).querySelector('.badge')!;
    expect(badge('FC-1').getAttribute('aria-label')).toBe('3 held');
    expect(badge('FC-1').textContent!.trim()).toBe('3 held');
    expect(badge('FC-7').getAttribute('aria-label')).toBe('1 held');
    expect(badge('FC-2').getAttribute('aria-label')).toBe('Not owned');
    expect(badge('FC-2').textContent!.trim()).toBe('Not owned');
    expect(tile('FC-2').querySelector('.veil')).not.toBeNull();
    expect(tile('FC-1').querySelector('.veil')).toBeNull();
  });

  // ─── 4.4 Buying ───────────────────────────────────────────────────────────

  it('buys a card, spending its price and marking it owned', async () => {
    await open({ rosaries: 150 });
    const control = buy('FC-1');
    expect(control.getAttribute('aria-label')).toBe('Buy Crawlid for 100 Rosaries');
    expect(control.getAttribute('aria-disabled')).toBeNull();

    control.click();
    render();

    expect(users.rosaries()).toBe(50);
    expect(purse()).toBe('50');
    expect(quantityOf(users.collection(), crawlid)).toBe(1);
    expect(tile('FC-1').querySelector('.badge')!.getAttribute('aria-label')).toBe('1 held');
    expect(el.querySelector('.set-section:first-child .sr-only')!.textContent!.trim()).toBe(
      `1 of ${FC_TOTAL} collected`,
    );
  });

  it('makes an unaffordable buy inert but focusable, with its reason', async () => {
    await open({ rosaries: 99 });
    const control = buy('FC-1');
    expect(control.disabled).toBe(false);
    expect(control.getAttribute('aria-disabled')).toBe('true');
    expect(control.getAttribute('title')).toBe('Not enough Rosaries');
    const described = control.getAttribute('aria-describedby')!;
    expect(el.querySelector(`#${described}`)!.textContent!.trim()).toBe('Not enough Rosaries');
    expect(control.textContent).toContain('100');

    control.click();
    render();
    expect(users.rosaries()).toBe(99);
    expect(quantityOf(users.collection(), crawlid)).toBe(0);
  });

  it('makes a buy available as soon as the balance reaches its price', async () => {
    await open({ rosaries: 90, collection: [held(7, 1)] });
    expect(buy('FC-1').getAttribute('aria-disabled')).toBe('true');
    sell('FC-7')!.click();
    render();
    expect(users.rosaries()).toBe(100);
    expect(buy('FC-1').getAttribute('aria-disabled')).toBeNull();
  });

  // ─── 4.5 Selling ──────────────────────────────────────────────────────────

  it('offers no sale for a card not held, holding its slot with a spacer', async () => {
    await open({ collection: [held(1, 1)] });
    expect(sell('FC-2')).toBeNull();
    const spacer = tile('FC-2').querySelector('.exchange-spacer')!;
    expect(spacer).not.toBeNull();
    expect(spacer.getAttribute('aria-hidden')).toBe('true');
    expect(spacer.tagName).not.toBe('BUTTON');
    expect(sell('FC-1')!.getAttribute('aria-label')).toBe('Sell Crawlid for 10 Rosaries');
  });

  it('warns which decks a sale would trim, and then trims exactly those', async () => {
    await open({
      collection: [held(1, 1), held(7, 1)],
      decks: [[ref(1)], [ref(7)], [ref(7), ref(1)]],
    });
    const control = sell('FC-1')!;
    expect(control.classList).toContain('is-warning');
    expect(control.querySelector('.warn-mark')).not.toBeNull();
    expect(control.getAttribute('title')).toBe('Selling removes it from Deck 1 and Deck 3');
    const described = control.getAttribute('aria-describedby')!;
    expect(el.querySelector(`#${described}`)!.textContent!.trim()).toBe(
      'Selling removes it from Deck 1 and Deck 3',
    );

    control.click();
    render();
    const decks = users.decks();
    expect(decks[0].cards).toEqual([]);
    expect(decks[1].cards).toEqual(['FC#7']);
    expect(decks[2].cards).toEqual(['FC#7']);
  });

  it('carries no warning when copies remain for every deck', async () => {
    await open({ collection: [held(1, 3)], decks: [[ref(1), ref(1)]] });
    const control = sell('FC-1')!;
    expect(control.classList).not.toContain('is-warning');
    expect(control.getAttribute('title')).toBeNull();
    expect(control.getAttribute('aria-describedby')).toBeNull();
  });

  // ─── 4.6 Announcements and focus ──────────────────────────────────────────

  it('announces a purchase and keeps focus on the buy control', async () => {
    await open({ rosaries: 100 });
    const control = buy('FC-1');
    control.focus();
    control.click();
    render();
    expect(announced()).toBe('Bought Crawlid for 100 Rosaries.');
    expect(document.activeElement).toBe(buy('FC-1'));
    expect(buy('FC-1')).toBe(control);
  });

  it('announces a trimming sale with its decks and moves focus to the buy control', async () => {
    await open({ collection: [held(1, 1)], decks: [[], [ref(1)]] });
    const control = sell('FC-1')!;
    control.focus();
    control.click();
    render();
    await fixture.whenStable();
    expect(announced()).toBe('Sold Crawlid for 10 Rosaries. Removed from Deck 2.');
    expect(sell('FC-1')).toBeNull();
    expect(document.activeElement).toBe(buy('FC-1'));
  });

  it('keeps focus on the sell control while copies remain', async () => {
    await open({ collection: [held(7, 2)] });
    const control = sell('FC-7')!;
    control.focus();
    control.click();
    render();
    expect(announced()).toBe(`Sold ${vengefly.name} for 10 Rosaries.`);
    expect(document.activeElement).toBe(control);
  });
});

describe('listing deck names', () => {
  it('reads as prose', () => {
    expect(listOf(['Deck 1'])).toBe('Deck 1');
    expect(listOf(['Deck 1', 'Deck 3'])).toBe('Deck 1 and Deck 3');
    expect(listOf(['Deck 1', 'Deck 2', 'Deck 3'])).toBe('Deck 1, Deck 2, and Deck 3');
  });
});
