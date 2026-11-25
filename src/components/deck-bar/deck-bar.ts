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
import { DECK_SIZE, Deck, DeckProblem, MAX_DECKS, deckName, deckStanding } from '../../model/deck';
import { fitOverlay } from '../../model/fit';
import { CardComponent } from '../card/card';
import { ConfirmDialog } from '../confirm-dialog/confirm-dialog';

/** One of the deck's nine positions, filled or free. */
interface Position {
  readonly index: number;
  readonly card: Card | null;
}

/** One line of the deck's standing, as the page words it. */
interface StandingLine {
  readonly kind: DeckProblem['kind'] | 'ready';
  /** The leading word that names the problem without colour; empty for Ready. */
  readonly word: string;
  readonly text: string;
}

/** "card" or "cards", for a count. */
function cardWord(count: number): string {
  return count === 1 ? 'card' : 'cards';
}

/**
 * The page's words for one problem. The model reports what is wrong as data;
 * how it is said is this region's to decide.
 */
function standingLine(problem: DeckProblem): StandingLine {
  if (problem.kind === 'invalid') {
    const over = problem.held - problem.allowed;
    const verb = problem.allowed === 1 ? 'is' : 'are';
    return {
      kind: 'invalid',
      word: 'Invalid',
      text:
        `${problem.held} ${cardWord(problem.held)} of ${problem.minStars}★ or more — only ${problem.allowed} ` +
        `${verb} allowed. Remove ${over}.`,
    };
  }
  return {
    kind: 'incomplete',
    word: 'Incomplete',
    text:
      `Add ${problem.needed} more ${cardWord(problem.needed)} from the collection below ` +
      `to battle with this deck.`,
  };
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
 * The words that name what keeps a deck out of battle, Invalid first — the
 * same leading words its standing uses. Empty for a Ready deck.
 */
function problemWords(deck: Deck): string {
  return deckStanding(deck)
    .problems.map((problem) => (problem.kind === 'invalid' ? 'Invalid' : 'Incomplete'))
    .join(' · ');
}

/**
 * The pinned region at the top of the Decks page: the deck buttons, the selected
 * deck's nine positions, and the controls that create and delete a deck.
 *
 * In `choose` mode — deck selection — it is read-only: no create or delete
 * control, no Remove strips, and a deck `eligible` refuses is listed but
 * disabled, saying why.
 *
 * It holds no user state of its own. Which deck is selected is the page's, and
 * every change is asked for by an output — the region renders what it is given
 * and reports what the player did to it.
 */
@Component({
  selector: 'app-deck-bar',
  imports: [CardComponent, ConfirmDialog],
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

  /** `edit` on the Decks page; `choose` on deck selection, which changes nothing. */
  readonly mode = input<'edit' | 'choose'>('edit');

  /** Which decks may be selected. Every deck, unless a page says otherwise. */
  readonly eligible = input<(deck: Deck) => boolean>(() => true);

  /** What the region says when no deck is selected. */
  readonly emptyText = input(
    'You have no decks. Create one to start building from the collection below.',
  );

  readonly selectDeck = output<number>();
  readonly createDeck = output<void>();
  readonly deleteDeck = output<number>();
  readonly removeCard = output<number>();
  readonly readCard = output<number>();

  readonly deckCardWidth = DECK_CARD_WIDTH;
  readonly maxDecks = MAX_DECKS;

  /** Why the create control is disabled at the limit — its tooltip and its description. */
  readonly limitText = `${MAX_DECKS} decks is the limit`;

  /** Raised while the player is being asked to confirm a deletion. */
  readonly confirming = signal(false);

  private readonly region = viewChild<ElementRef<HTMLElement>>('region');
  private readonly regionWrap = viewChild<ElementRef<HTMLElement>>('regionWrap');
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly scale = signal(1);

  readonly names = computed(() => this.decks().map((_, i) => deckName(i)));

  /**
   * Why each deck cannot be selected, or `null` where it can. A deck the page
   * deems ineligible is named by its standing's problems.
   */
  readonly refusals = computed<(string | null)[]>(() => {
    const eligible = this.eligible();
    return this.decks().map((deck) =>
      eligible(deck) ? null : problemWords(deck) || 'Unavailable',
    );
  });

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

  /**
   * The selected deck's standing in words: each problem, the error first, or a
   * single all-clear when there is none.
   */
  readonly standing = computed<StandingLine[]>(() => {
    const deck = this.selectedDeck();
    if (!deck) return [];
    const problems = deckStanding(deck).problems;
    return problems.length > 0
      ? problems.map(standingLine)
      : [{ kind: 'ready', word: '', text: 'Ready for battle' }];
  });

  /** At the limit the control stays in place, disabled, and says why. */
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

  /** A disabled deck button emits nothing. */
  onSelect(index: number): void {
    if (this.refusals()[index] !== null) return;
    this.selectDeck.emit(index);
  }

  /** The click guard for the disabled state; the model would refuse anyway. */
  onCreate(): void {
    if (!this.canCreate()) return;
    this.createDeck.emit();
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
