import {
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { Card, CARD_BY_KEY } from '../../model/card';
import { DECK_SIZE, Deck, MAX_DECKS, deckName } from '../../model/deck';
import { fitOverlay } from '../../model/fit';
import { CardComponent } from '../card/card';
import { CardMenu } from '../card-menu/card-menu';

/** One of the deck's nine positions, filled or free. */
interface Position {
  readonly index: number;
  readonly card: Card | null;
}

/**
 * The width one deck position is laid out at, in CSS pixels.
 *
 * Above the card renderer's 120px minimum rather than at it, so the row has a
 * little to give before the fit has to scale anything at all. Nine of these in
 * a row is wider than the narrowest viewport on the project's ladder, which is
 * why the region scales — see `regionScale`.
 */
const DECK_CARD_WIDTH = 128;

/**
 * The pinned region at the top of the Cards page: the deck tabs, the selected
 * deck's nine positions, and the controls that create and delete a deck.
 *
 * It holds no user state of its own. Which deck is selected is the page's, and
 * every change is asked for by an output — the region renders what it is given
 * and reports what the player did to it.
 */
@Component({
  selector: 'app-deck-bar',
  imports: [CardComponent, CardMenu],
  templateUrl: './deck-bar.html',
  styleUrl: './deck-bar.css',
  host: {
    '[style.--deck-cw.px]': 'deckCardWidth',
    '[style.--deck-scale]': 'regionScale()',
  },
})
export class DeckBar {
  readonly decks = input.required<readonly Deck[]>();

  /** Which deck is on screen; null when the player holds none. */
  readonly selectedIndex = input.required<number | null>();

  /** The position whose menu is open, if the open menu is one of this row's. */
  readonly openPosition = input<number | null>(null);

  readonly selectDeck = output<number>();
  readonly createDeck = output<void>();
  readonly deleteDeck = output<number>();
  readonly selectCard = output<number>();
  readonly removeCard = output<number>();
  readonly readCard = output<number>();
  readonly dismissMenu = output<void>();

  readonly deckCardWidth = DECK_CARD_WIDTH;
  readonly maxDecks = MAX_DECKS;
  readonly deckSize = DECK_SIZE;

  /** Raised while the player is being asked to confirm a deletion. */
  readonly confirming = signal(false);

  /** Which tab the roving tabindex currently rests on. */
  readonly focusedTab = signal(0);

  private readonly region = viewChild<ElementRef<HTMLElement>>('region');
  private readonly regionWrap = viewChild<ElementRef<HTMLElement>>('regionWrap');
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly scale = signal(1);

  readonly names = computed(() => this.decks().map((_, i) => deckName(i)));

  readonly selectedDeck = computed<Deck | null>(() => {
    const index = this.selectedIndex();
    return index === null ? null : (this.decks()[index] ?? null);
  });

  /** The nine positions, whether or not a card occupies them. */
  readonly positions = computed<Position[]>(() => {
    const cards = this.selectedDeck()?.cards ?? [];
    return Array.from({ length: DECK_SIZE }, (_, index) => ({
      index,
      card: index < cards.length ? (CARD_BY_KEY.get(cards[index]) ?? null) : null,
    }));
  });

  readonly filledCount = computed(() => this.selectedDeck()?.cards.length ?? 0);

  readonly isFull = computed(() => this.filledCount() >= DECK_SIZE);

  /** At the limit the control is absent, not disabled — the page says why. */
  readonly canCreate = computed(() => this.decks().length < MAX_DECKS);

  readonly selectedName = computed(() => {
    const index = this.selectedIndex();
    return index === null ? '' : deckName(index);
  });

  /**
   * The factor the whole region is viewed through.
   *
   * Nine positions in a row is wider than the narrowest viewport the project
   * supports, and the card spec's answer to that is a uniform scale over the
   * whole region rather than a card laid out below its minimum. CSS cannot
   * divide one length by another, so the ratio is measured here and handed back
   * as a custom property — the same mechanism the pack opening uses.
   */
  readonly regionScale = computed(() => this.scale());

  constructor() {
    // The row's laid-out width changes with the deck list — a row appears when
    // the first deck is created — so the fit is recomputed then as well as on
    // a resize. A transform does not affect an element's layout size, so
    // measuring the thing being scaled cannot feed back into the measurement.
    effect(() => {
      this.decks();
      this.selectedIndex();
      this.measure();
    });

    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => this.measure());
    observer.observe(this.host.nativeElement);
    this.destroyRef.onDestroy(() => observer.disconnect());
  }

  onTabKeydown(event: KeyboardEvent, index: number): void {
    const count = this.decks().length;
    if (count === 0) return;

    let next: number | null = null;
    if (event.key === 'ArrowRight') next = (index + 1) % count;
    else if (event.key === 'ArrowLeft') next = (index - 1 + count) % count;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = count - 1;
    if (next === null) return;

    event.preventDefault();
    this.focusedTab.set(next);
    this.selectDeck.emit(next);
    this.focusTab(next);
  }

  askToDelete(): void {
    if (this.selectedIndex() === null) return;
    this.confirming.set(true);
  }

  confirmDelete(): void {
    const index = this.selectedIndex();
    this.confirming.set(false);
    if (index !== null) this.deleteDeck.emit(index);
  }

  private focusTab(index: number): void {
    const tabs = this.host.nativeElement.querySelectorAll<HTMLElement>('.deck-tab');
    tabs[index]?.focus();
  }

  /**
   * Measures the row against the width it has, and sizes the wrapper from the
   * same factor: a scaled element still occupies its laid-out height, so the
   * collection below would start too low if the wrapper were not told.
   */
  private measure(): void {
    const region = this.region()?.nativeElement;
    const wrap = this.regionWrap()?.nativeElement;
    if (!region || !wrap) return;

    // The wrapper's width is the space the row actually has — the bar's own
    // padding is already taken out of it. The row's `offsetWidth` is its
    // laid-out width, which a transform does not change, so measuring the
    // thing being scaled cannot feed back into the measurement.
    this.scale.set(
      fitOverlay(
        { width: wrap.clientWidth, height: Number.MAX_SAFE_INTEGER },
        { width: region.offsetWidth, height: 1 },
      ),
    );
  }
}
