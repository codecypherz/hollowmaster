import { Component, ElementRef, computed, inject, signal } from '@angular/core';
import {
  CARD_SETS,
  Card,
  CardKey,
  CardSet,
  cardKey,
  cardsInSet,
  collectionNumber,
} from '../../model/card';
import {
  RATE_UNKNOWN,
  actionLabel,
  cardSlug,
  changeText,
  lowerLabel,
  maxPending,
  quantityFor,
  quantityLabel,
  raiseLabel,
  raiseRefusal,
} from '../../model/cart';
import { DECK_SIZE, deckName, listOf } from '../../model/deck';
import {
  ExchangeAction,
  decksTrimmedBySale,
  knowsRate,
  rosariesText,
  unitPrice,
} from '../../model/exchange';
import { createParticleField, particleVars } from '../../model/particle';
import { UserState, quantityOf } from '../../model/user';
import { CartService, CartSummary } from '../../services/cart.service';
import { UserService } from '../../services/user.service';
import { CardComponent } from '../card/card';
import { CardReader } from '../card-reader/card-reader';
import { CartDialog } from '../cart-dialog/cart-dialog';
import { ExchangeRates } from '../exchange-rates/exchange-rates';
import { QuantityStepper } from '../quantity-stepper/quantity-stepper';
import { Rosary } from '../rosary/rosary';

/** A tile's Sell row or its Buy row: what is pending that way, and what can be asked for. */
export interface ExchangeRow {
  readonly action: ExchangeAction;
  /** The row's visible label. */
  readonly label: string;
  /** Copies pending this way. */
  readonly quantity: number;
  /** Whether a quantity can be typed: not where none could be pending at all. */
  readonly editable: boolean;
  readonly canRaise: boolean;
  readonly raiseReason: string;
  readonly raiseLabel: string;
  readonly lowerLabel: string;
  readonly fieldLabel: string;
  /** The control that brings the copies held to exactly `DECK_SIZE`. */
  readonly target: {
    readonly face: string;
    readonly label: string;
    /** The quantity it sets, worked out from the copies held rather than what is pending. */
    readonly quantity: number;
    /** Why it is unavailable; empty when it is on offer. */
    readonly reason: string;
  };
  /** The price per copy, or null where the player does not know the card's rate. */
  readonly price: number | null;
  /** The same in words, for assistive technology. */
  readonly priceText: string;
  /** The decks the pending sale would trim, in words; empty when it would trim none. */
  readonly warning: string;
}

/** One card of a set: what is held of it, and what is pending. */
export interface ExchangeTile {
  readonly card: Card;
  readonly key: CardKey;
  /** A DOM-safe form of the key, for ids and `data-` hooks. */
  readonly slug: string;
  /** The set code and the number within it, as `FC#1`. */
  readonly number: string;
  /** Copies held; zero for a card not owned. Unaffected by anything pending. */
  readonly quantity: number;
  /** The Sell row, then the Buy row. */
  readonly rows: readonly ExchangeRow[];
}

/** One named set's section: its tiles in set-number order, and how much is held. */
export interface SetSection {
  readonly set: CardSet;
  readonly tiles: readonly ExchangeTile[];
  /** Distinct cards of the set held at least once. */
  readonly collected: number;
}

/**
 * The Collection page: every card of every set, owned or not, and the Rosary
 * exchange. Each tile's rows line up sales and purchases in the cart; nothing
 * is bought or sold until the cart is confirmed in its dialog.
 *
 * Two rows — the pinned top bar (cart, header, and purse) above the scrolling
 * sections — with nothing `position: sticky`, as on the Decks page.
 *
 * The page holds only screen state: the last announcement, which card is being
 * read, and whether the cart is open. Every fact — the balance, the quantities, what is pending,
 * which decks a sale would trim — is read from `UserService` and `CartService`
 * through `computed`, and every change is asked of them, so a card opened in
 * the Shop or a deck built on the Decks page is here on arrival.
 */
@Component({
  selector: 'app-collection',
  imports: [CardComponent, CardReader, CartDialog, ExchangeRates, QuantityStepper, Rosary],
  templateUrl: './collection.html',
  styleUrl: './collection.css',
})
export class Collection {
  private readonly users = inject(UserService);
  private readonly cart = inject(CartService);
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);

  readonly particles = createParticleField(14, 0xc011ec7);
  readonly vars = particleVars;

  readonly pending = this.cart.count;

  /** Whether the cart dialog is up. */
  readonly cartOpen = signal(false);

  /** The card being read, at most one. */
  readonly reading = signal<Card | null>(null);

  /** What the live region last said. Set after each change, never on arrival. */
  readonly announcement = signal('');

  readonly cartLabel = computed(() => {
    const count = this.pending();
    return `Cart, ${count === 0 ? 'no' : count} ${count === 1 ? 'card' : 'cards'} pending`;
  });

  readonly sections = computed<SetSection[]>(() => {
    const state = this.users.state();
    return CARD_SETS.map((set) => {
      const tiles = cardsInSet(set.id).map((card): ExchangeTile => {
        return {
          card,
          key: cardKey(card),
          slug: cardSlug(card),
          number: collectionNumber(card),
          quantity: quantityOf(state.collection, card),
          rows: [this.sellRow(state, card), this.buyRow(state, card)],
        };
      });
      return { set, tiles, collected: tiles.filter((tile) => tile.quantity > 0).length };
    });
  });

  private sellRow(state: UserState, card: Card): ExchangeRow {
    const held = quantityOf(state.collection, card);
    const row = this.row(state, 'sell', card, held);
    const trims = decksTrimmedBySale(state, card, row.quantity).map(deckName);
    return {
      ...row,
      target: {
        face: `↓${DECK_SIZE}`,
        label: `Sell down to ${DECK_SIZE} ${card.name}`,
        quantity: held - DECK_SIZE,
        reason: held > DECK_SIZE ? '' : `You hold ${DECK_SIZE} or fewer`,
      },
      warning: trims.length > 0 ? `Selling removes it from ${listOf(trims)}` : '',
    };
  }

  private buyRow(state: UserState, card: Card): ExchangeRow {
    const held = quantityOf(state.collection, card);
    const noTarget = held < DECK_SIZE ? '' : `You hold ${DECK_SIZE} or more`;
    return {
      ...this.row(state, 'buy', card, held),
      target: {
        face: `↑${DECK_SIZE}`,
        label: `Buy up to ${DECK_SIZE} ${card.name}`,
        quantity: DECK_SIZE - held,
        reason: knowsRate(state, card.stars) ? noTarget : RATE_UNKNOWN,
      },
      warning: '',
    };
  }

  /** What both rows state the same way. */
  private row(state: UserState, action: ExchangeAction, card: Card, held: number) {
    const quantity = quantityFor(this.cart.lines(), cardKey(card), action);
    const rateKnown = knowsRate(state, card.stars);
    const max = maxPending(action, held, rateKnown);
    const price = rateKnown ? unitPrice(card, action) : null;
    return {
      action,
      label: actionLabel(action),
      quantity,
      editable: max > 0,
      canRaise: quantity < max,
      raiseReason: raiseRefusal(action, held, quantity, rateKnown),
      raiseLabel: raiseLabel(action, card),
      lowerLabel: lowerLabel(action, card),
      fieldLabel: quantityLabel(action, card),
      price,
      priceText: price === null ? '' : `${rosariesText(price)} each`,
    };
  }

  /** The ids a row is described by: its price, and its warning, where it has them. */
  rowDescription(row: ExchangeRow, hook: string): string | null {
    const ids = [row.priceText && `price-${hook}`, row.warning && `trim-${hook}`];
    return ids.filter(Boolean).join(' ') || null;
  }

  // ─── Pending changes ──────────────────────────────────────────────────────

  onStep(tile: ExchangeTile, row: ExchangeRow, by: 1 | -1): void {
    // From the cart rather than the row: a quantity typed a moment ago may not
    // have been rendered yet.
    this.setQuantity(tile, row, this.cart.quantityFor(tile.card, row.action) + by);
  }

  onEntered(tile: ExchangeTile, row: ExchangeRow, quantity: number): void {
    this.setQuantity(tile, row, quantity);
  }

  /** Sets the quantity that leaves exactly `DECK_SIZE`. Unavailable is focusable but inert. */
  onTarget(tile: ExchangeTile, row: ExchangeRow): void {
    if (row.target.reason) return;
    this.setQuantity(tile, row, row.target.quantity);
  }

  private setQuantity(tile: ExchangeTile, row: ExchangeRow, quantity: number): void {
    const before = this.cart.quantityFor(tile.card, row.action);
    const change = this.cart.setQuantity(tile.card, row.action, quantity);
    if (change.quantity !== before) this.announcement.set(changeText(change));
  }

  // ─── Reading ──────────────────────────────────────────────────────────────

  read(card: Card): void {
    this.reading.set(card);
  }

  /** Closes the reader, handing focus back to the card it was opened from. */
  closeReader(): void {
    const card = this.reading();
    this.reading.set(null);
    if (!card) return;
    queueMicrotask(() => {
      this.host.nativeElement
        .querySelector<HTMLElement>(`[data-card="${cardSlug(card)}"] .tile-card button`)
        ?.focus({ preventScroll: true });
    });
  }

  // ─── The cart ─────────────────────────────────────────────────────────────

  openCart(): void {
    // So the same change made again after the dialog closes is news again.
    this.announcement.set('');
    this.cartOpen.set(true);
  }

  closeCart(): void {
    this.cartOpen.set(false);
  }

  /** Settles the cart and says what that did. A refusal leaves everything as it was. */
  onConfirm(): void {
    const summary = this.cart.confirm();
    if (!summary) return;
    this.cartOpen.set(false);
    this.announcement.set(summaryText(summary));
  }
}

/** A confirmed cart's outcome, as assistive technology is told it. */
export function summaryText({ sold, bought, net, trims }: CartSummary): string {
  const rosaries =
    net === 0
      ? 'no Rosaries gained or spent'
      : `${rosariesText(Math.abs(net))} ${net > 0 ? 'gained' : 'spent'}`;
  const removed = trims.length > 0 ? ` Cards removed from ${listOf(trims)}.` : '';
  return `${sold} sold, ${bought} bought, ${rosaries}.${removed}`;
}
