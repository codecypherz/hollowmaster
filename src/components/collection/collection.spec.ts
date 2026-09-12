import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CARD_BY_KEY, cardKeyOf } from '../../model/card';
import { MAX_DECKS } from '../../model/deck';
import { UserService } from '../../services/user.service';
import { Collection } from './collection';

const crawlid = CARD_BY_KEY.get(cardKeyOf('FC', 1))!;

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

  it('opens on the first deck, ordered by rarity', () => {
    expect(page.selectedDeck()).toBe(0);
    expect(page.sort()).toBe('rarity');
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

    expect(page.canAdd()).toBe(false);
    expect(page.addReason()).toContain('Create a deck');
  });

  it('withholds adding with a stated reason when the deck is full', () => {
    for (let i = 0; i < 9; i++) page.onAddToDeck(indexOf(page, crawlid));
    fixture.detectChanges();

    expect(page.selectedDeckCards()).toHaveLength(9);
    expect(page.canAdd()).toBe(false);
    expect(page.addReason()).toContain('full');
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
