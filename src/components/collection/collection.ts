import { Component, computed, effect, inject, signal } from '@angular/core';
import { CARD_BY_KEY, Card } from '../../model/card';
import { DEFAULT_SORT, SORTS, SortKey, ownedCards, sortOwned } from '../../model/collection';
import { DECK_SIZE, deckName } from '../../model/deck';
import { createParticleField, particleVars } from '../../model/particle';
import { UserService } from '../../services/user.service';
import { CardReader } from '../card-reader/card-reader';
import { CollectionGrid } from '../collection-grid/collection-grid';
import { DeckBar } from '../deck-bar/deck-bar';

/** Which of the page's two regions a selection is in. */
type Region = 'deck' | 'collection';

/** The one open menu, or the card being read: a region and a position in it. */
interface Selection {
  readonly region: Region;
  readonly index: number;
}

/**
 * The Cards page: the player's collection, and the decks built from it.
 *
 * Two rows — the pinned deck region above, the scrolling collection below —
 * and nothing between them is `position: sticky`. The region is pinned because
 * it is a grid row that does not scroll, which a long collection cannot defeat
 * the way it can defeat a sticky element inside one scroller.
 *
 * The page holds only screen state: which deck is on screen, which card's menu
 * is open, which card is being read, and how the collection is ordered. Every
 * *user* fact — the decks, the collection, the balance — is read from
 * `UserService`, and every change is asked of it, so a card granted by a pack
 * in the Shop is here on arrival without the page being reloaded.
 */
@Component({
  selector: 'app-collection',
  imports: [CardReader, CollectionGrid, DeckBar],
  templateUrl: './collection.html',
  styleUrl: './collection.css',
  host: {
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class Collection {
  private readonly users = inject(UserService);

  readonly particles = createParticleField(14, 0xc0115);
  readonly vars = particleVars;
  readonly sorts = SORTS;

  readonly decks = this.users.decks;

  /** How the collection is ordered. The page opens on the rarest first. */
  readonly sort = signal<SortKey>(DEFAULT_SORT);

  /** The deck on screen. Screen state: nothing else in the application reads it. */
  readonly selectedDeck = signal<number | null>(0);

  /** The one open action menu, at most. */
  readonly openMenu = signal<Selection | null>(null);

  /** The card being read, at most one. */
  readonly reading = signal<Selection | null>(null);

  /** The cards the player holds, in the order in effect. */
  readonly owned = computed(() => sortOwned(ownedCards(this.users.collection()), this.sort()));

  readonly selectedDeckCards = computed(() => {
    const index = this.selectedDeck();
    return index === null ? [] : (this.decks()[index]?.cards ?? []);
  });

  readonly deckIsFull = computed(() => this.selectedDeckCards().length >= DECK_SIZE);

  /** What the collection's add action is called, naming the deck it fills. */
  readonly addLabel = computed(() => {
    const index = this.selectedDeck();
    return index === null ? 'Add to deck' : `Add to ${deckName(index)}`;
  });

  readonly canAdd = computed(() => this.selectedDeck() !== null && !this.deckIsFull());

  /** Why adding is not on offer — the same words wherever it is withheld. */
  readonly addReason = computed(() => {
    if (this.selectedDeck() === null) return 'Create a deck first.';
    if (this.deckIsFull()) return `${deckName(this.selectedDeck()!)} is full.`;
    return '';
  });

  /** The card the reader is showing, resolved from whichever region opened it. */
  readonly readingCard = computed<Card | null>(() => {
    const selection = this.reading();
    if (!selection) return null;
    return selection.region === 'collection'
      ? (this.owned()[selection.index]?.card ?? null)
      : (this.deckCardAt(selection.index) ?? null);
  });

  readonly readingFromDeck = computed(() => this.reading()?.region === 'deck');

  /** The deck position whose menu is open, when the open menu is the deck's. */
  readonly openDeckPosition = computed(() => this.positionOf('deck'));

  /** The collection tile whose menu is open, when the open menu is the grid's. */
  readonly openCollectionIndex = computed(() => this.positionOf('collection'));

  constructor() {
    // The selected deck is clamped rather than remembered: a deletion
    // renumbers every deck after it, so an index that outlived its deck would
    // silently name a different one.
    effect(() => {
      const count = this.decks().length;
      const selected = this.selectedDeck();
      if (count === 0) {
        if (selected !== null) this.selectedDeck.set(null);
        return;
      }
      if (selected === null || selected >= count) this.selectedDeck.set(count - 1);
    });
  }

  // ─── The deck region ──────────────────────────────────────────────────────

  onSelectDeck(index: number): void {
    this.selectedDeck.set(index);
    this.closeMenu();
  }

  onCreateDeck(): void {
    if (this.users.createDeck()) this.selectedDeck.set(this.decks().length - 1);
    this.closeMenu();
  }

  onDeleteDeck(index: number): void {
    this.users.deleteDeck(index);
    this.closeMenu();
  }

  onSelectDeckCard(position: number): void {
    this.toggleMenu('deck', position);
  }

  onRemoveFromDeck(position: number): void {
    const deck = this.selectedDeck();
    if (deck === null) return;
    this.users.removeCardFromDeck(deck, position);
    this.closeMenu();
    this.finishReading();
  }

  // ─── The collection ───────────────────────────────────────────────────────

  onSelectCollectionCard(index: number): void {
    this.toggleMenu('collection', index);
  }

  onAddToDeck(index: number): void {
    const deck = this.selectedDeck();
    const card = this.owned()[index]?.card;
    if (deck === null || !card) return;
    this.users.addCardToDeck(deck, card);
    this.closeMenu();
    this.finishReading();
  }

  onSort(key: SortKey): void {
    this.sort.set(key);
    this.closeMenu();
  }

  // ─── Reading ──────────────────────────────────────────────────────────────

  onRead(region: Region, index: number): void {
    this.openMenu.set(null);
    this.reading.set({ region, index });
  }

  /** The reader's deck action: add from the collection, remove from the deck. */
  onReaderAction(): void {
    const selection = this.reading();
    if (!selection) return;
    if (selection.region === 'deck') this.onRemoveFromDeck(selection.index);
    else this.onAddToDeck(selection.index);
  }

  /**
   * Closes the reader after an action taken from inside it, handing focus back
   * to where the player was. The card may be gone — a removed deck position —
   * in which case nothing is focused and the next Tab starts from the top.
   */
  private finishReading(): void {
    const selection = this.reading();
    this.reading.set(null);
    if (selection) this.restoreFocus(selection);
  }

  closeReader(): void {
    const selection = this.reading();
    this.reading.set(null);
    if (selection) this.restoreFocus(selection);
  }

  closeMenu(): void {
    this.openMenu.set(null);
  }

  /** Dismissing a menu hands focus back to the card it was raised over. */
  dismissMenu(): void {
    const selection = this.openMenu();
    this.openMenu.set(null);
    if (selection) this.restoreFocus(selection);
  }

  /**
   * A click anywhere that is neither a card nor the menu itself dismisses the
   * open menu. Clicks on a card are excluded because the click that *opens* a
   * menu reaches the document too — and because selecting another card is
   * already the "close this one, open that one" path.
   */
  onDocumentClick(event: MouseEvent): void {
    if (!this.openMenu()) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest('app-card-menu') || target?.closest('app-card')) return;
    this.openMenu.set(null);
  }

  private toggleMenu(region: Region, index: number): void {
    const open = this.openMenu();
    const same = open && open.region === region && open.index === index;
    this.openMenu.set(same ? null : { region, index });
  }

  private positionOf(region: Region): number | null {
    const open = this.openMenu();
    return open && open.region === region ? open.index : null;
  }

  private deckCardAt(position: number): Card | undefined {
    const key = this.selectedDeckCards()[position];
    return key ? CARD_BY_KEY.get(key) : undefined;
  }

  /**
   * Puts focus back on the card an overlay was opened from.
   *
   * The card renderer draws an accessible button, and it is that button — not
   * the tile around it — the player's focus was on, so that is what it returns
   * to. The lookup is by position because the card component's element is not
   * held anywhere: the two regions are lists, and a position names one row of
   * one of them.
   */
  private restoreFocus(selection: Selection): void {
    queueMicrotask(() => {
      const container =
        selection.region === 'deck'
          ? document.querySelector('app-deck-bar .deck-row')
          : document.querySelector('app-collection-grid .grid');
      const holders = container?.children ?? [];
      const holder = holders[selection.index] as HTMLElement | undefined;
      holder?.querySelector<HTMLElement>('button')?.focus();
    });
  }
}
