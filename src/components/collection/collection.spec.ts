import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CARD_BY_KEY, cardKeyOf } from '../../model/card';
import { MAX_DECKS } from '../../model/deck';
import { STARTER_CARD_KEYS } from '../../model/user';
import { UserService } from '../../services/user.service';
import { Collection } from './collection';

const crawlid = CARD_BY_KEY.get(cardKeyOf('FC', 1))!;
const goam = CARD_BY_KEY.get(cardKeyOf('FC', 6))!;

describe('the Cards page', () => {
  let fixture: ComponentFixture<Collection>;
  let page: Collection;
  let users: UserService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    users = TestBed.inject(UserService);
    fixture = TestBed.createComponent(Collection);
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

  it('opens one menu at a time and closes it on a second selection', () => {
    page.onSelectCollectionCard(0);
    expect(page.openMenu()).toEqual({ region: 'collection', index: 0 });

    page.onSelectCollectionCard(1);
    expect(page.openMenu()).toEqual({ region: 'collection', index: 1 });

    page.onSelectCollectionCard(1);
    expect(page.openMenu()).toBeNull();
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
    page.onSelectCollectionCard(0);
    page.askToReset();
    expect(page.confirmingReset()).toBe(true);

    page.onReset();
    fixture.detectChanges();

    expect(page.confirmingReset()).toBe(false);
    expect(users.geo()).toBe(0);
    expect(users.decks()).toEqual([{ cards: [] }]);
    expect(page.selectedDeck()).toBe(0);
    expect(page.sort()).toEqual({ key: 'rarity', direction: 'desc' });
    expect(page.openMenu()).toBeNull();
    expect(page.reading()).toBeNull();
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
function indexOf(page: Collection, card: { name: string }): number {
  return page.owned().findIndex((o) => o.card.name === card.name);
}
