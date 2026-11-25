import {
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CARD_BY_KEY, Card } from '../../model/card';
import {
  DEFAULT_SORT_STATE,
  OwnedCard,
  SORTS,
  SortKey,
  SortState,
  groupByRarity,
  nextSort,
  ownedCards,
  sortOwned,
} from '../../model/collection';
import { AddRefusal, addRefusal, copiesInDeck, deckName } from '../../model/deck';
import { createParticleField, particleVars } from '../../model/particle';
import { CartService } from '../../services/cart.service';
import { UserService } from '../../services/user.service';
import { CardReader } from '../card-reader/card-reader';
import { CollectionGrid } from '../collection-grid/collection-grid';
import { ConfirmDialog } from '../confirm-dialog/confirm-dialog';
import { DeckBar } from '../deck-bar/deck-bar';

/** One collection tile: the card, how many are held, and what the selected deck makes of it. */
export interface Tile extends OwnedCard {
  /** How many copies the selected deck uses; zero when no deck is selected. */
  readonly used: number;
  /** Why adding is withheld, in the page's words; empty when it is on offer. */
  readonly addReason: string;
}

/** A run of tiles, labelled with its star rating when the order is rarity. */
export interface TileSection {
  /** The rating this section holds, or null for the single unlabelled run. */
  readonly stars: number | null;
  /** The flat index of the section's first tile. */
  readonly start: number;
  readonly tiles: readonly Tile[];
}

/** Which of the page's two regions a card is in. */
type Region = 'deck' | 'collection';

/** The card being read: a region and a position in it. */
interface Selection {
  readonly region: Region;
  readonly index: number;
}

/**
 * The Decks page: the player's collection, and the decks built from it.
 *
 * Two rows — the pinned deck region above, the scrolling collection below —
 * and nothing between them is `position: sticky`. The region is pinned because
 * it is a grid row that does not scroll, which a long collection cannot defeat
 * the way it can defeat a sticky element inside one scroller.
 *
 * The page holds only screen state: which deck is on screen, which card is being
 * read, and how the collection is ordered. Every *user* fact — the decks, the collection, the balance — is read from
 * `UserService`, and every change is asked of it, so a card granted by a pack
 * in the Shop is here on arrival without the page being reloaded.
 */
@Component({
  selector: 'app-decks',
  imports: [CardReader, CollectionGrid, ConfirmDialog, DeckBar],
  templateUrl: './decks.html',
  styleUrl: './decks.css',
})
export class Decks {
  private readonly users = inject(UserService);
  private readonly cart = inject(CartService);
  private readonly injector = inject(Injector);
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);

  readonly particles = createParticleField(14, 0xc0115);
  readonly vars = particleVars;
  readonly sorts = SORTS;

  readonly decks = this.users.decks;

  /** How the collection is ordered, and which way. The page opens on the rarest first. */
  readonly sort = signal<SortState>(DEFAULT_SORT_STATE);

  /**
   * Bumped on every change of order or direction. The grid keys its tiles on
   * it, so a reorder recreates every tile and every one replays its entrance —
   * not only the ones the DOM diff happened to move.
   */
  readonly sortGeneration = signal(0);

  /** Raised while the player is being asked to confirm a reset. */
  readonly confirmingReset = signal(false);

  /** The deck on screen. Screen state: nothing else in the application reads it. */
  readonly selectedDeck = signal<number | null>(0);

  /** The card being read, at most one. */
  readonly reading = signal<Selection | null>(null);

  /** The cards the player holds, in the order in effect. */
  readonly owned = computed(() => {
    const { key, direction } = this.sort();
    return sortOwned(ownedCards(this.users.collection()), key, direction);
  });

  readonly selectedDeckCards = computed(() => {
    const index = this.selectedDeck();
    return index === null ? [] : (this.decks()[index]?.cards ?? []);
  });

  /** The selected deck's name, or null when there is none — the badge words its count by it. */
  readonly selectedDeckName = computed(() => {
    const index = this.selectedDeck();
    return index === null ? null : deckName(index);
  });

  /** What the collection's add action is called, naming the deck it fills. */
  readonly addLabel = computed(() => {
    const index = this.selectedDeck();
    return index === null ? 'Add to deck' : `Add to ${deckName(index)}`;
  });

  /**
   * Every tile, with what the selected deck makes of its card. Its add button
   * and the reader both read from here, so the two cannot disagree about
   * whether a card can be added, or why not.
   */
  readonly tiles = computed<Tile[]>(() => {
    const state = this.users.state();
    const index = this.selectedDeck();
    const deck = index === null ? null : (state.decks[index] ?? null);
    return this.owned().map((entry) => ({
      ...entry,
      used: deck ? copiesInDeck(deck, entry.card) : 0,
      addReason: reasonText(
        index === null ? 'no-deck' : addRefusal(state, index, entry.card),
        index,
      ),
    }));
  });

  /**
   * The tiles in sections: one per star rating when ordered by rarity, and a
   * single unlabelled run otherwise. Tiles keep their flat index throughout.
   */
  readonly sections = computed<TileSection[]>(() => {
    const tiles = this.tiles();
    if (this.sort().key !== 'rarity') return [{ stars: null, start: 0, tiles }];
    return groupByRarity(tiles).map((section) => ({
      stars: section.stars,
      start: section.start,
      tiles: section.entries,
    }));
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

  /** Why the reader's add is withheld — the same tile entry its add button reads. */
  readonly readingAddReason = computed(() => {
    const selection = this.reading();
    if (!selection || selection.region !== 'collection') return '';
    return this.tiles()[selection.index]?.addReason ?? '';
  });

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
  }

  onCreateDeck(): void {
    if (this.users.createDeck()) this.selectedDeck.set(this.decks().length - 1);
  }

  onDeleteDeck(index: number): void {
    this.users.deleteDeck(index);
  }

  onRemoveFromDeck(position: number): void {
    const deck = this.selectedDeck();
    if (deck === null) return;
    if (!this.users.removeCardFromDeck(deck, position)) return;
    this.reading.set(null);
    this.focusAfterRemoval(position);
  }

  // ─── The collection ───────────────────────────────────────────────────────

  onAddToDeck(index: number): void {
    const deck = this.selectedDeck();
    const card = this.owned()[index]?.card;
    if (deck === null || !card) return;
    this.users.addCardToDeck(deck, card);
    this.closeReader();
  }

  onSort(key: SortKey): void {
    this.sort.update((current) => nextSort(current, key));
    this.sortGeneration.update((g) => g + 1);
  }

  // ─── Reset ────────────────────────────────────────────────────────────────

  askToReset(): void {
    this.confirmingReset.set(true);
  }

  /** Replaces the player's data with a new player's, empties the cart, and starts over. */
  onReset(): void {
    this.confirmingReset.set(false);
    this.users.reset();
    this.cart.clear();
    this.selectedDeck.set(0);
    this.sort.set(DEFAULT_SORT_STATE);
    this.sortGeneration.update((g) => g + 1);
    this.reading.set(null);
  }

  // ─── Reading ──────────────────────────────────────────────────────────────

  onRead(region: Region, index: number): void {
    this.reading.set({ region, index });
  }

  /** The reader's deck action: add from the collection, remove from the deck. */
  onReaderAction(): void {
    const selection = this.reading();
    if (!selection) return;
    if (selection.region === 'deck') this.onRemoveFromDeck(selection.index);
    else this.onAddToDeck(selection.index);
  }

  /** Closes the reader, if one is open, handing focus back to the card it was opened from. */
  closeReader(): void {
    const selection = this.reading();
    this.reading.set(null);
    if (selection) this.restoreFocus(selection);
  }

  private deckCardAt(position: number): Card | undefined {
    const key = this.selectedDeckCards()[position];
    return key ? CARD_BY_KEY.get(key) : undefined;
  }

  /**
   * Puts focus back on the card the reader was opened from.
   *
   * The card renderer draws an accessible button, and it is that button — not
   * the tile around it — the player's focus was on, so that is what it returns
   * to. The lookup is by position because the card component's element is not
   * held anywhere: the two regions are lists, and a position names one row of
   * one of them. Nothing scrolls: the card is where the player left it.
   */
  private restoreFocus({ region, index }: Selection): void {
    queueMicrotask(() => {
      // Collection tiles are split across a grid per rarity section, so they
      // are found by their flat index rather than as one container's children.
      const card =
        region === 'deck'
          ? this.find(`app-deck-bar .slot:nth-child(${index + 1}) .slot-card button`)
          : this.find(`app-collection-grid .tile[data-index="${index}"] .tile-card button`);
      card?.focus({ preventScroll: true });
    });
  }

  /**
   * After a removal, focus goes to the Remove button now at that position, else
   * to the last card's, else to the selected deck's own button.
   */
  private focusAfterRemoval(position: number): void {
    afterNextRender(
      () => {
        const removes = this.host.nativeElement.querySelectorAll<HTMLElement>(
          'app-deck-bar .slot .remove',
        );
        const heir = removes[Math.min(position, removes.length - 1)];
        (heir ?? this.find('app-deck-bar .deck-btn.is-selected'))?.focus({ preventScroll: true });
      },
      { injector: this.injector },
    );
  }

  private find(selector: string): HTMLElement | null {
    return this.host.nativeElement.querySelector<HTMLElement>(selector);
  }
}

/** The page's words for why adding is withheld; empty when it is on offer. */
function reasonText(refusal: AddRefusal | null, deckIndex: number | null): string {
  switch (refusal) {
    case null:
      return '';
    case 'no-deck':
      return 'Create a deck first.';
    case 'full':
      return `${deckName(deckIndex!)} is full.`;
    case 'exhausted':
      return `Every copy you hold is already in ${deckName(deckIndex!)}.`;
    case 'unowned':
      // Unreachable from a tile — the collection lists only held cards — but
      // stated, so a new reason cannot arrive here silently as "on offer".
      return 'You hold no copy of this card.';
  }
}
