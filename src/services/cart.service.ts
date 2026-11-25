import { Injectable, computed, inject, signal } from '@angular/core';
import { CARD_BY_KEY, Card, CardKey, cardKey } from '../model/card';
import {
  CartChange,
  CartLine,
  maxPending,
  quantityFor,
  remove,
  setQuantity,
  withinHeld,
} from '../model/cart';
import { deckName } from '../model/deck';
import { ExchangeAction, decksTrimmedBySale, knowsRate, rosaryEffect } from '../model/exchange';
import { quantityOf } from '../model/user';
import { UserService } from './user.service';

/** One line of the cart, joined with everything a surface says about it. */
export interface CartRow extends CartLine {
  readonly card: Card;
  /** Copies held, unaffected by anything pending. */
  readonly held: number;
  /** Whether the player knows the card's Rosary rate. */
  readonly rateKnown: boolean;
  /** The most that may be pending this way. */
  readonly max: number;
  /** What the line does to the Rosary balance: positive for a sale. */
  readonly effect: number;
  /** The names of the decks it would take copies out of, in order. */
  readonly trims: readonly string[];
}

/** What a confirmed cart did. */
export interface CartSummary {
  readonly sold: number;
  readonly bought: number;
  readonly net: number;
  /** The names of the decks that lost copies, in order. */
  readonly trims: readonly string[];
}

/**
 * The cart: an order of sales and purchases the player is still building.
 *
 * Separate from `UserService` because nothing in it has happened. It is never
 * persisted, and root scope is the whole of its lifetime: it survives moving
 * between pages and is gone on reload. Everything but the lines themselves is
 * `computed` against the user, so a balance or a quantity changing anywhere is
 * reflected here.
 */
@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly users = inject(UserService);
  private readonly _lines = signal<readonly CartLine[]>([]);

  /** The pending lines, in the order their cards were first added. */
  readonly lines = computed(() => withinHeld(this._lines(), (key) => this.heldOf(key)));

  readonly rows = computed<readonly CartRow[]>(() => {
    const state = this.users.state();
    return this.lines().map((line): CartRow => {
      // A line is only ever made from a `Card`, so its key resolves.
      const card = CARD_BY_KEY.get(line.key)!;
      const held = quantityOf(state.collection, card);
      const rateKnown = knowsRate(state, card.stars);
      const trims = line.action === 'sell' ? decksTrimmedBySale(state, card, line.quantity) : [];
      return {
        ...line,
        card,
        held,
        rateKnown,
        max: maxPending(line.action, held, rateKnown),
        effect: rosaryEffect(card, line.action, line.quantity),
        trims: trims.map(deckName),
      };
    });
  });

  /** Copies pending, across every line and both directions. */
  readonly count = computed(() => this.lines().reduce((sum, line) => sum + line.quantity, 0));

  readonly isEmpty = computed(() => this.lines().length === 0);

  /** The total of the sales less the total of the purchases. */
  readonly net = computed(() => this.rows().reduce((sum, row) => sum + row.effect, 0));

  readonly balanceAfter = computed(() => this.users.rosaries() + this.net());

  /** How many Rosaries the player is short by; zero when the net is affordable. */
  readonly shortfall = computed(() => Math.max(0, -this.balanceAfter()));

  readonly canConfirm = computed(() => !this.isEmpty() && this.shortfall() === 0);

  quantityFor(card: Card, action: ExchangeAction): number {
    return quantityFor(this.lines(), cardKey(card), action);
  }

  /** Sets how many copies are pending that way, within its bound, and reports what that did. */
  setQuantity(card: Card, action: ExchangeAction, quantity: number): CartChange {
    const other: ExchangeAction = action === 'sell' ? 'buy' : 'sell';
    const otherBefore = this.quantityFor(card, other);
    const key = cardKey(card);
    const rateKnown = knowsRate(this.users.state(), card.stars);
    this._lines.set(setQuantity(this.lines(), key, action, quantity, this.heldOf(key), rateKnown));
    return {
      card,
      action,
      quantity: this.quantityFor(card, action),
      cleared: otherBefore > 0 && this.quantityFor(card, other) === 0,
    };
  }

  /** Takes a card out of the cart. */
  remove(card: Card): void {
    this._lines.set(remove(this.lines(), cardKey(card)));
  }

  clear(): void {
    this._lines.set([]);
  }

  /**
   * Settles the whole cart and empties it, or does neither and returns `null`.
   *
   * The summary is read before settling, since afterwards the copies and the
   * decks it describes are gone.
   */
  confirm(): CartSummary | null {
    if (!this.canConfirm()) return null;
    const summary = this.summarise();
    if (!this.users.settle(this.lines())) return null;
    this.clear();
    return summary;
  }

  private summarise(): CartSummary {
    const total = (action: ExchangeAction) =>
      this.lines().reduce((sum, line) => sum + (line.action === action ? line.quantity : 0), 0);
    const trimmed = new Set(this.rows().flatMap((row) => row.trims));
    const inDeckOrder = this.users.decks().map((_, i) => deckName(i));
    return {
      sold: total('sell'),
      bought: total('buy'),
      net: this.net(),
      trims: inDeckOrder.filter((name) => trimmed.has(name)),
    };
  }

  private heldOf(key: CardKey): number {
    return this.users.collection().get(key) ?? 0;
  }
}
