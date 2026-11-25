import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CARD_BY_KEY, cardKeyOf } from '../../model/card';
import { MAX_DECKS } from '../../model/deck';
import { STARTER_CARD_KEYS } from '../../model/user';
import { CartService } from '../../services/cart.service';
import { UserService } from '../../services/user.service';
import { Decks } from './decks';

const crawlid = CARD_BY_KEY.get(cardKeyOf('FC', 1))!;
const goam = CARD_BY_KEY.get(cardKeyOf('FC', 6))!;

describe('the Decks page', () => {
  let fixture: ComponentFixture<Decks>;
  let page: Decks;
  let users: UserService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    users = TestBed.inject(UserService);
    fixture = TestBed.createComponent(Decks);
    page = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('keeps its atmosphere but draws no corner frame', () => {
    for (const part of ['.void-bg', '.mist-layer', '.particles .particle']) {
      expect(fixture.nativeElement.querySelector(part), part).not.toBeNull();
    }
    expect(fixture.nativeElement.querySelectorAll('.corner')).toHaveLength(0);
  });

  it('opens on the first deck, ordered by rarity', () => {
    expect(page.selectedDeck()).toBe(0);
    expect(page.sort()).toEqual({ key: 'rarity', direction: 'desc' });
  });

  it('selects the deck it creates', () => {
    page.onCreateDeck();
    fixture.detectChanges();
    expect(users.decks()).toHaveLength(2);
    expect(page.selectedDeck()).toBe(1);
  });

  it('selects a surviving deck when the one on screen is deleted', () => {
    page.onCreateDeck();
    page.onCreateDeck();
    fixture.detectChanges();
    expect(page.selectedDeck()).toBe(2);

    page.onDeleteDeck(2);
    fixture.detectChanges();

    expect(users.decks()).toHaveLength(2);
    expect(page.selectedDeck()).toBe(1);
  });

  it('leaves no selection when the last deck is deleted', () => {
    page.onDeleteDeck(0);
    fixture.detectChanges();

    expect(users.decks()).toEqual([]);
    expect(page.selectedDeck()).toBeNull();
  });

  it('withholds adding with a stated reason when there is no deck', () => {
    page.onDeleteDeck(0);
    fixture.detectChanges();

    for (const tile of page.tiles()) expect(tile.addReason).toBe('Create a deck first.');
  });

  it('withholds adding with a stated reason when the deck is full', () => {
    for (const key of STARTER_CARD_KEYS) {
      page.onAddToDeck(indexOf(page, CARD_BY_KEY.get(key)!));
    }
    fixture.detectChanges();

    expect(page.selectedDeckCards()).toHaveLength(9);
    for (const tile of page.tiles()) expect(tile.addReason).toBe('Deck 1 is full.');
  });

  it('withholds a card whose every held copy the deck uses, per deck', () => {
    page.onAddToDeck(indexOf(page, crawlid));
    fixture.detectChanges();

    const tile = () => page.tiles()[indexOf(page, crawlid)];
    expect(tile().used).toBe(1);
    expect(tile().addReason).toBe('Every copy you hold is already in Deck 1.');

    page.onCreateDeck();
    fixture.detectChanges();
    expect(page.selectedDeck()).toBe(1);
    expect(tile().used).toBe(0);
    expect(tile().addReason).toBe('');
  });

  it("gives the reader the same availability as the card's tile", () => {
    page.onAddToDeck(indexOf(page, crawlid));
    fixture.detectChanges();

    const index = indexOf(page, crawlid);
    page.onRead('collection', index);
    expect(page.readingAddReason()).toBe(page.tiles()[index].addReason);
    expect(page.readingAddReason()).not.toBe('');

    const other = indexOf(page, CARD_BY_KEY.get(STARTER_CARD_KEYS[1])!);
    page.onRead('collection', other);
    expect(page.readingAddReason()).toBe('');
  });

  it('names the deck the add action fills', () => {
    expect(page.addLabel()).toBe('Add to Deck 1');
    page.onCreateDeck();
    fixture.detectChanges();
    expect(page.addLabel()).toBe('Add to Deck 2');
  });

  // ─── Reading ────────────────────────────────────────────────────────────

  const root = (): HTMLElement => fixture.nativeElement;
  const reader = () => root().querySelector<HTMLElement>('app-card-reader');
  const tileOf = (card: { name: string }) =>
    root().querySelector<HTMLElement>(`.tile[data-index="${indexOf(page, card)}"]`)!;
  const cardIn = (holder: Element) => holder.querySelector<HTMLButtonElement>('app-card button')!;
  const slots = () => [...root().querySelectorAll<HTMLElement>('.slot')];
  const addOf = (card: { name: string }) => tileOf(card).querySelector<HTMLButtonElement>('.add')!;
  const removes = () => [...root().querySelectorAll<HTMLButtonElement>('.slot .remove')];

  /** Presses a control the way a player does, so it also holds focus. */
  async function press(control: HTMLElement): Promise<void> {
    control.focus();
    control.click();
    fixture.detectChanges();
    await fixture.whenStable();
  }

  /** Attached for tests that follow focus, which only moves within a document. */
  beforeEach(() => document.body.appendChild(fixture.nativeElement));
  afterEach(() => fixture.nativeElement.remove());

  it('reads a collection card at one activation, and gives focus back on closing', async () => {
    const card = cardIn(tileOf(crawlid));
    expect(card.getAttribute('aria-haspopup')).toBe('dialog');
    expect(card.getAttribute('aria-pressed')).toBeNull();
    await press(card);
    expect(reader()!.getAttribute('aria-label')).toBe('Reading Crawlid');
    expect(reader()!.querySelector('.action-primary')!.textContent!.trim()).toBe('Add to Deck 1');

    reader()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(reader()).toBeNull();
    expect(document.activeElement).toBe(card);
    expect(page.selectedDeckCards()).toEqual([]);
  });

  it('reads a deck card at one activation, offering its removal', async () => {
    page.onAddToDeck(indexOf(page, crawlid));
    fixture.detectChanges();
    const card = cardIn(slots()[0]);
    expect(card.getAttribute('aria-haspopup')).toBe('dialog');
    await press(card);
    expect(reader()!.getAttribute('aria-label')).toBe('Reading Crawlid');
    await press(reader()!.querySelector<HTMLElement>('.action:not(.action-primary)')!);
    expect(reader()).toBeNull();
    expect(document.activeElement).toBe(card);

    await press(card);
    await press(reader()!.querySelector<HTMLElement>('.action-primary')!);
    expect(reader()).toBeNull();
    expect(page.selectedDeckCards()).toEqual([]);
    expect(document.activeElement).toBe(root().querySelector('.deck-btn.is-selected'));
  });

  it('adds from the reader and hands focus back to the card', async () => {
    const card = cardIn(tileOf(crawlid));
    await press(card);
    await press(reader()!.querySelector<HTMLElement>('.action-primary')!);
    expect(page.selectedDeckCards()).toEqual([cardKeyOf('FC', 1)]);
    expect(document.activeElement).toBe(card);
  });

  // ─── Adding ─────────────────────────────────────────────────────────────

  it('shows an add button on every tile, naming the selected deck and the card', async () => {
    const faces = () =>
      new Set([...root().querySelectorAll('.tile .add')].map((b) => b.textContent!.trim()));
    expect(root().querySelectorAll('.tile .add')).toHaveLength(page.owned().length);
    expect(faces()).toEqual(new Set(['Add to Deck 1']));
    expect(addOf(crawlid).getAttribute('aria-label')).toBe('Add to Deck 1: Crawlid');

    page.onCreateDeck();
    fixture.detectChanges();
    expect(faces()).toEqual(new Set(['Add to Deck 2']));

    // The card comes before its button in the order of focus.
    const stops = [...tileOf(crawlid).querySelectorAll('button')];
    expect(stops).toEqual([cardIn(tileOf(crawlid)), addOf(crawlid)]);
  });

  it('adds from the tile, opening no reader and keeping focus', async () => {
    users.grantCards([crawlid]);
    fixture.detectChanges();
    const add = addOf(crawlid);
    await press(add);
    expect(page.selectedDeckCards()).toEqual([cardKeyOf('FC', 1)]);
    expect(reader()).toBeNull();
    expect(document.activeElement).toBe(add);
  });

  /** An add that is still there and focusable, but inert and saying why. */
  async function expectWithheld(reason: string, face: string): Promise<void> {
    const add = addOf(crawlid);
    expect(add.textContent!.trim()).toBe(face);
    expect(add.disabled).toBe(false);
    expect(add.getAttribute('aria-disabled')).toBe('true');
    expect(add.title).toBe(reason);
    const described = root().querySelector(`#${add.getAttribute('aria-describedby')}`)!;
    expect(described.textContent).toBe(reason);
    const before = users.state();
    await press(add);
    expect(users.state()).toBe(before);
    expect(document.activeElement).toBe(add);
  }

  it('withholds an add in place when every copy is used', async () => {
    await press(addOf(crawlid));
    await expectWithheld('Every copy you hold is already in Deck 1.', 'Add to Deck 1');
    await press(removes()[0]);
    expect(addOf(crawlid).getAttribute('aria-disabled')).toBeNull();
    expect(addOf(crawlid).getAttribute('title')).toBeNull();
  });

  it('withholds an add in place when the deck is full', async () => {
    for (const key of STARTER_CARD_KEYS) page.onAddToDeck(indexOf(page, CARD_BY_KEY.get(key)!));
    fixture.detectChanges();
    await expectWithheld('Deck 1 is full.', 'Add to Deck 1');
  });

  it('withholds an add in place when there is no deck', async () => {
    page.onDeleteDeck(0);
    fixture.detectChanges();
    await expectWithheld('Create a deck first.', 'Add to deck');
  });

  // ─── Removing ───────────────────────────────────────────────────────────

  const vengefly = CARD_BY_KEY.get(cardKeyOf('FC', 7))!;
  const gruzzer = CARD_BY_KEY.get(cardKeyOf('FC', 8))!;

  function fill(): void {
    for (const card of [crawlid, vengefly, gruzzer]) page.onAddToDeck(indexOf(page, card));
    fixture.detectChanges();
  }

  it('shows Remove beneath every filled position and no other', () => {
    fill();
    expect(slots()).toHaveLength(9);
    expect(removes().map((b) => b.textContent!.trim())).toEqual(['Remove', 'Remove', 'Remove']);
    expect(removes()[1].getAttribute('aria-label')).toBe('Remove Vengefly from Deck 1');
    expect(root().querySelectorAll('.slot .slot-strip')).toHaveLength(9);
    const stops = [...slots()[0].querySelectorAll('button')];
    expect(stops).toEqual([cardIn(slots()[0]), removes()[0]]);
  });

  it('removes that copy, focusing the Remove now at its position', async () => {
    fill();
    await press(removes()[1]);
    expect(page.selectedDeckCards()).toEqual([cardKeyOf('FC', 1), cardKeyOf('FC', 8)]);
    expect(reader()).toBeNull();
    expect(document.activeElement).toBe(removes()[1]);
    expect(removes()[1].getAttribute('aria-label')).toBe('Remove Gruzzer from Deck 1');
  });

  it('focuses the last card’s Remove when the last is removed', async () => {
    fill();
    await press(removes()[2]);
    expect(document.activeElement).toBe(removes()[1]);
  });

  it('focuses the selected deck’s button when the only card is removed', async () => {
    page.onAddToDeck(indexOf(page, crawlid));
    fixture.detectChanges();
    await press(removes()[0]);
    expect(removes()).toEqual([]);
    expect(document.activeElement).toBe(root().querySelector('.deck-btn.is-selected'));
  });

  // ─── The badge ──────────────────────────────────────────────────────────

  it('inverts an exhausted badge and adds no mark to it', async () => {
    const badge = () => tileOf(crawlid).querySelector('.badge')!;
    expect(badge().classList).not.toContain('is-exhausted');
    await press(addOf(crawlid));
    expect(badge().classList).toContain('is-exhausted');
    expect(badge().textContent!.trim()).toBe('1/1');
    expect(badge().querySelector('svg, img')).toBeNull();
  });

  it('leaves the deck on screen alone when the order changes', () => {
    page.onAddToDeck(indexOf(page, crawlid));
    fixture.detectChanges();
    const before = page.selectedDeckCards();

    page.onSort('name');
    fixture.detectChanges();

    expect(page.selectedDeck()).toBe(0);
    expect(page.selectedDeckCards()).toEqual(before);
  });

  it('reverses the direction when the active order is chosen again', () => {
    page.onSort('attack');
    expect(page.sort()).toEqual({ key: 'attack', direction: 'desc' });
    page.onSort('attack');
    expect(page.sort()).toEqual({ key: 'attack', direction: 'asc' });
    const attacks = page.owned().map((o) => o.card.attack);
    expect(attacks).toEqual([...attacks].sort((a, b) => a - b));
  });

  it('opens a newly chosen order in its default direction', () => {
    page.onSort('attack');
    page.onSort('attack');
    page.onSort('name');
    expect(page.sort()).toEqual({ key: 'name', direction: 'asc' });
  });

  it('bumps the generation on every reorder and on nothing else', () => {
    const start = page.sortGeneration();
    page.onSort('name');
    page.onSort('name');
    expect(page.sortGeneration()).toBe(start + 2);

    page.onAddToDeck(0);
    users.grantCards([crawlid]);
    expect(page.sortGeneration()).toBe(start + 2);
  });

  it('sections the collection only when ordered by rarity', () => {
    users.grantCards([goam]);
    fixture.detectChanges();

    expect(page.sections().map((s) => s.stars)).toEqual([4, 1]);
    expect(page.sections()[1].start).toBe(1);

    page.onSort('name');
    expect(page.sections()).toHaveLength(1);
    expect(page.sections()[0].stars).toBeNull();
    expect(page.sections()[0].tiles).toHaveLength(page.owned().length);
  });

  it('resets to a new player, the first deck, and the default order', () => {
    users.creditGeo(200);
    users.grantCards([goam]);
    page.onCreateDeck();
    page.onSort('name');
    page.onRead('collection', 0);
    page.askToReset();
    expect(page.confirmingReset()).toBe(true);

    page.onReset();
    fixture.detectChanges();

    expect(page.confirmingReset()).toBe(false);
    expect(users.geo()).toBe(0);
    expect(users.decks()).toEqual([{ cards: [] }]);
    expect(page.selectedDeck()).toBe(0);
    expect(page.sort()).toEqual({ key: 'rarity', direction: 'desc' });
    expect(page.reading()).toBeNull();
  });

  it('empties the cart on a reset', () => {
    const cart = TestBed.inject(CartService);
    cart.setQuantity(goam, 'buy', 2);
    cart.setQuantity(crawlid, 'sell', 1);
    expect(cart.count()).toBe(3);

    page.askToReset();
    expect(cart.count()).toBe(3);
    page.onReset();

    expect(cart.lines()).toEqual([]);
  });

  it('orders the collection rarest first on arrival', () => {
    const stars = page.owned().map((o) => o.card.stars);
    expect(stars).toEqual([...stars].sort((a, b) => b - a));
  });

  it('stops offering a new deck at the limit', () => {
    for (let i = 1; i < MAX_DECKS; i++) page.onCreateDeck();
    fixture.detectChanges();

    expect(users.decks()).toHaveLength(MAX_DECKS);
    expect(page.onCreateDeck()).toBeUndefined();
    expect(users.decks()).toHaveLength(MAX_DECKS);
  });
});

/** Where a card sits in the collection under the order in effect. */
function indexOf(page: Decks, card: { name: string }): number {
  return page.owned().findIndex((o) => o.card.name === card.name);
}
