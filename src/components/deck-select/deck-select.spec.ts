import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { cardKey, cardKeyOf } from '../../model/card';
import { Deck } from '../../model/deck';
import { STARTER_CARD_KEYS, seedUser, toPersisted } from '../../model/user';
import { GameService } from '../../services/game.service';
import { USER_STORE, UserStore } from '../../services/user-store';
import { UserService } from '../../services/user.service';
import { READY_TEST_DECK } from '../../testing/ready-deck';
import { DeckSelect } from './deck-select';

const reversed: Deck = { cards: [...STARTER_CARD_KEYS].reverse() };
const incomplete: Deck = { cards: STARTER_CARD_KEYS.slice(0, 8) };
const falseKnight = cardKeyOf('FC', 17);
const invalid: Deck = {
  cards: [falseKnight, falseKnight, falseKnight, ...STARTER_CARD_KEYS.slice(0, 6)],
};

/**
 * A store holding a user with the starter cards and three False Knights — enough for
 * every deck above to load as built — and the stated decks and remembered deck.
 */
function storeWith(decks: readonly Deck[], battleDeck: number | null): UserStore {
  const collection = new Map(seedUser().collection).set(falseKnight, 3);
  const record = toPersisted({ ...seedUser(), collection, decks, battleDeck });
  return { load: async () => record, save: async () => {} };
}

describe('the deck selection page', () => {
  let fixture: ComponentFixture<DeckSelect>;
  let page: DeckSelect;
  let users: UserService;
  let game: GameService;
  let router: Router;

  /** Renders the page for a user holding `decks`, remembering `battleDeck`. */
  async function render(decks: readonly Deck[], battleDeck: number | null = null): Promise<void> {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: USER_STORE, useValue: storeWith(decks, battleDeck) },
      ],
    });
    users = TestBed.inject(UserService);
    game = TestBed.inject(GameService);
    router = TestBed.inject(Router);
    // The app initializer's job: the page never sees the pre-load seed.
    await users.load();
    fixture = TestBed.createComponent(DeckSelect);
    page = fixture.componentInstance;
    fixture.detectChanges();
  }

  const el = () => fixture.nativeElement as HTMLElement;
  const deckButtons = () => [...el().querySelectorAll<HTMLButtonElement>('app-deck-bar .deck-btn')];
  const beginButton = () => el().querySelector<HTMLButtonElement>('button.begin')!;

  it('opens on the first Ready deck when none is remembered', async () => {
    await render([incomplete, READY_TEST_DECK, reversed]);
    expect(page.chosen()).toBe(1);
    expect(deckButtons()[1].getAttribute('aria-pressed')).toBe('true');
  });

  it('opens on the remembered deck when it is Ready', async () => {
    await render([READY_TEST_DECK, READY_TEST_DECK, reversed], 2);
    expect(page.chosen()).toBe(2);
  });

  it('passes over a remembered deck that is no longer Ready', async () => {
    await render([incomplete, READY_TEST_DECK], 0);
    expect(page.chosen()).toBe(1);
  });

  it('shows the Decks page look: header, atmosphere, and no corner frame', async () => {
    await render([READY_TEST_DECK]);
    expect(el().querySelector('.screen-header-title')!.textContent!.trim()).toBe('Choose a Deck');
    for (const part of ['.void-bg', '.mist-layer', '.particles .particle']) {
      expect(el().querySelector(part), part).not.toBeNull();
    }
    expect(el().querySelectorAll('.corner')).toHaveLength(0);
  });

  it('offers no control that changes a deck', async () => {
    await render([READY_TEST_DECK, incomplete]);
    expect(el().querySelector('.create-deck')).toBeNull();
    expect(el().querySelector('.delete-deck')).toBeNull();
    expect(el().querySelector('.controls-sep')).toBeNull();
    expect(el().querySelectorAll('button.remove')).toHaveLength(0);
    expect(el().querySelectorAll('button.add')).toHaveLength(0);
  });

  it('disables a deck that is not Ready, says why, and does not choose it', async () => {
    await render([READY_TEST_DECK, incomplete, invalid]);
    const [, inc, inv] = deckButtons();
    expect(inc.getAttribute('aria-disabled')).toBe('true');
    expect(inc.dataset['tip']).toBe('Incomplete');
    expect(el().querySelector(`#${inc.getAttribute('aria-describedby')}`)!.textContent).toBe(
      'Incomplete',
    );
    expect(inv.dataset['tip']).toBe('Invalid');

    inc.click();
    inv.click();
    fixture.detectChanges();
    expect(page.chosen()).toBe(0);
    expect(users.battleDeck()).toBeNull();
    expect(deckButtons()[0].getAttribute('aria-disabled')).toBeNull();
  });

  it('names both problems, Invalid first', async () => {
    const both: Deck = {
      cards: [falseKnight, falseKnight, falseKnight, ...STARTER_CARD_KEYS.slice(0, 3)],
    };
    await render([READY_TEST_DECK, both]);
    expect(deckButtons()[1].dataset['tip']).toBe('Invalid · Incomplete');
  });

  it('records a choice at once and shows that deck', async () => {
    await render([READY_TEST_DECK, reversed]);
    deckButtons()[1].click();
    fixture.detectChanges();
    expect(page.chosen()).toBe(1);
    expect(users.battleDeck()).toBe(1);
    expect(el().querySelectorAll('app-deck-bar .slot app-card')).toHaveLength(9);
    expect(el().querySelector('app-deck-bar .standing-item')!.textContent).toContain(
      'Ready for battle',
    );
  });

  it('begins a match with the chosen deck as the hand, records it, and goes to the game', async () => {
    await render([READY_TEST_DECK, reversed]);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    page.onChoose(1);
    beginButton().click();

    expect(game.isActive()).toBe(true);
    expect(game.state()!.player.hand.map((card) => cardKey(card!))).toEqual(reversed.cards);
    expect(users.battleDeck()).toBe(1);
    expect(navigate).toHaveBeenCalledWith(['/game']);
  });

  it('records the default when the battle begins with it untouched', async () => {
    await render([incomplete, READY_TEST_DECK]);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    expect(users.battleDeck()).toBeNull();
    beginButton().click();
    expect(users.battleDeck()).toBe(1);
  });

  it('starts nothing with no deck chosen, keeping the control focusable and saying why', async () => {
    await render(seedUser().decks);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const begin = beginButton();
    expect(page.chosen()).toBeNull();
    expect(begin.disabled).toBe(false);
    expect(begin.getAttribute('aria-disabled')).toBe('true');
    expect(el().querySelector(`#${begin.getAttribute('aria-describedby')}`)!.textContent).toBe(
      'Choose a ready deck to battle',
    );

    begin.click();
    expect(game.isActive()).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('tells a new player no deck is ready and offers the Decks page', async () => {
    await render(seedUser().decks);
    expect(el().querySelector('.empty-state')!.textContent).toContain(
      'None of your decks is ready for battle.',
    );
    const link = el().querySelector<HTMLAnchorElement>('.empty-state a')!;
    expect(link.textContent!.trim()).toBe('Build a deck');
    expect(link.getAttribute('href')).toBe('/decks');
    expect(deckButtons()[0].dataset['tip']).toBe('Incomplete');
  });

  it('reads a deck card with Close as the only control', async () => {
    await render([READY_TEST_DECK]);
    el().querySelector<HTMLButtonElement>('app-deck-bar .slot app-card button')!.click();
    fixture.detectChanges();
    const reader = el().querySelector('app-card-reader')!;
    expect(reader).not.toBeNull();
    const buttons = reader.querySelectorAll('button');
    expect(buttons).toHaveLength(1);
    expect(buttons[0].textContent!.trim()).toMatch(/close/i);

    page.closeReader();
    fixture.detectChanges();
    expect(el().querySelector('app-card-reader')).toBeNull();
  });

  it('leaves every deck as it was', async () => {
    await render([READY_TEST_DECK, reversed, incomplete]);
    const before = users.decks();
    page.onChoose(1);
    page.onRead(3);
    page.closeReader();
    page.onChoose(0);
    expect(users.decks()).toBe(before);
    expect(users.collection()).toBe(users.state().collection);
  });
});
