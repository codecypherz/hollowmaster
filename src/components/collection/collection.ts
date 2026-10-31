import { Component, Injector, afterNextRender, computed, inject, signal } from '@angular/core';
import { CARD_SETS, Card, CardKey, CardSet, cardKey, cardsInSet } from '../../model/card';
import { deckName } from '../../model/deck';
import { decksTrimmedBySale, purchasePrice, salePrice } from '../../model/exchange';
import { createParticleField, particleVars } from '../../model/particle';
import { quantityOf } from '../../model/user';
import { UserService } from '../../services/user.service';
import { CardComponent } from '../card/card';
import { Rosary } from '../rosary/rosary';

/** One card of a set, and what the player can do with it right now. */
export interface ExchangeTile {
  readonly card: Card;
  readonly key: CardKey;
  /** A DOM-safe form of the key, for ids and `data-` hooks. */
  readonly slug: string;
  /** Copies held; zero for a card not owned. */
  readonly quantity: number;
  readonly buyPrice: number;
  readonly sellPrice: number;
  /** Whether the Rosary balance covers the purchase price. */
  readonly affordable: boolean;
  /** The names of the decks one sale would take the card out of, in order. */
  readonly trims: readonly string[];
}

/** One named set's section: its tiles in set-number order, and how much is held. */
export interface SetSection {
  readonly set: CardSet;
  readonly tiles: readonly ExchangeTile[];
  /** Distinct cards of the set held at least once. */
  readonly collected: number;
}

/** The reason an unaffordable purchase is withheld, as the control states it. */
export const NOT_ENOUGH_ROSARIES = 'Not enough Rosaries';

/**
 * The Collection page: every card of every set, owned or not, and the Rosary
 * exchange that buys and sells them.
 *
 * Two rows — the pinned top bar (header and purse) above the scrolling
 * sections — with nothing `position: sticky`, as on the Decks page.
 *
 * The page holds only screen state: the last announcement. Every fact — the
 * balance, the quantities, which decks a sale would trim — is read from
 * `UserService` through `computed`, and every change is asked of it, so a
 * card opened in the Shop or a deck built on the Decks page is here on arrival.
 */
@Component({
  selector: 'app-collection',
  imports: [CardComponent, Rosary],
  templateUrl: './collection.html',
  styleUrl: './collection.css',
})
export class Collection {
  private readonly users = inject(UserService);
  private readonly injector = inject(Injector);

  readonly particles = createParticleField(14, 0xc011ec7);
  readonly vars = particleVars;
  readonly notEnough = NOT_ENOUGH_ROSARIES;

  readonly rosaries = this.users.rosaries;

  /** What the live region last said. Set after each exchange, never on arrival. */
  readonly announcement = signal('');

  readonly sections = computed<SetSection[]>(() => {
    const state = this.users.state();
    return CARD_SETS.map((set) => {
      const tiles = cardsInSet(set.id).map((card): ExchangeTile => {
        const key = cardKey(card);
        const buyPrice = purchasePrice(card);
        return {
          card,
          key,
          slug: key.replace('#', '-'),
          quantity: quantityOf(state.collection, card),
          buyPrice,
          sellPrice: salePrice(card),
          affordable: state.rosaries >= buyPrice,
          trims: decksTrimmedBySale(state, card).map(deckName),
        };
      });
      return { set, tiles, collected: tiles.filter((tile) => tile.quantity > 0).length };
    });
  });

  /** Buys one copy. An unaffordable control is focusable but inert. */
  onBuy(tile: ExchangeTile): void {
    if (!tile.affordable) return;
    if (!this.users.buyCard(tile.card)) return;
    this.announcement.set(`Bought ${tile.card.name} for ${tile.buyPrice} Rosaries.`);
  }

  /**
   * Sells one copy, trimming the decks the control warned of. When that was
   * the last copy the sell control goes, so focus moves to the same tile's buy
   * control rather than falling back to the document.
   */
  onSell(tile: ExchangeTile): void {
    if (!this.users.sellCard(tile.card)) return;
    const removed = tile.trims.length > 0 ? ` Removed from ${listOf(tile.trims)}.` : '';
    this.announcement.set(`Sold ${tile.card.name} for ${tile.sellPrice} Rosaries.${removed}`);
    if (tile.quantity === 1) {
      afterNextRender(
        () => document.querySelector<HTMLElement>(`[data-buy="${tile.slug}"]`)?.focus(),
        { injector: this.injector },
      );
    }
  }

  buyLabel(tile: ExchangeTile): string {
    return `Buy ${tile.card.name} for ${tile.buyPrice} Rosaries`;
  }

  sellLabel(tile: ExchangeTile): string {
    return `Sell ${tile.card.name} for ${tile.sellPrice} Rosaries`;
  }

  /** The sell control's warning, naming every deck the sale would trim. */
  trimText(tile: ExchangeTile): string {
    return `Selling removes it from ${listOf(tile.trims)}`;
  }
}

/** `Deck 1`, `Deck 1 and Deck 3`, `Deck 1, Deck 2, and Deck 3`. */
export function listOf(names: readonly string[]): string {
  if (names.length <= 2) return names.join(' and ');
  return `${names.slice(0, -1).join(', ')}, and ${names.at(-1)}`;
}
