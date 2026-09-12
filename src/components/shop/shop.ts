import { Component, computed, inject, signal } from '@angular/core';
import { createParticleField, particleVars } from '../../model/particle';
import { Card, CARD_DB } from '../../model/card';
import { PACKS, PackDefinition, drawPack, revealOrder } from '../../model/pack';
import { UserService } from '../../services/user.service';
import { PackOpening } from '../pack-opening/pack-opening';
import { PackComponent } from '../pack/pack';
import { Geo } from '../geo/geo';

/**
 * How much Geo the development grant credits. One Level 3 pack, so a tester
 * reaches the most interesting odds in a single click.
 */
const DEV_GRANT_GEO = 500;

/**
 * An opening in progress: the pack that was bought and the five cards it gave
 * up. The two travel together because the overlay shows both — the wrapper the
 * storefront sold, tearing open, and then its cards.
 */
export interface Opening {
  readonly pack: PackDefinition;
  readonly cards: readonly Card[];
}

/**
 * The Shop.
 *
 * It sells packs and nothing else: the draw comes from `pack.ts`, the spend
 * from `UserService`, and the reveal from `PackOpening`. What is local here is
 * the storefront — the purse, the wares, and which of them the player can
 * currently afford.
 */
@Component({
  selector: 'app-shop',
  imports: [PackOpening, PackComponent, Geo],
  templateUrl: './shop.html',
  styleUrl: './shop.css',
})
export class Shop {
  private readonly user = inject(UserService);

  readonly particles = createParticleField(14, 0x5409);
  readonly vars = particleVars;

  /** The player's purse. Named by the Geo mark on the page; zero shows as zero. */
  readonly geo = this.user.geo;

  readonly grantAmount = DEV_GRANT_GEO;

  /**
   * The three tiers in ascending price order. The order comes from the price
   * rather than from the order they happen to be declared in.
   */
  readonly wares: readonly PackDefinition[] = [...PACKS].sort((a, b) => a.price - b.price);

  /** The pack being opened and its cards, or null when the storefront is at rest. */
  readonly opening = signal<Opening | null>(null);

  /** Every pack the purse cannot currently reach. */
  readonly unaffordable = computed(() => {
    const geo = this.user.geo();
    return new Set(this.wares.filter((w) => w.price > geo).map((w) => w.id));
  });

  canAfford(def: PackDefinition): boolean {
    return !this.unaffordable().has(def.id);
  }

  /**
   * Buys a pack: draw it, settle the purchase, then open the overlay.
   *
   * The order matters. The purchase is settled *before* anything is revealed,
   * so the five cards are the player's from the moment they paid — leaving the
   * page mid-reveal cannot forfeit them — and a purchase that does not settle
   * opens nothing.
   */
  buy(def: PackDefinition): void {
    if (!this.canAfford(def)) return;
    const drawn = drawPack(def, CARD_DB);
    if (!this.user.purchase(def.price, drawn)) return;
    this.opening.set({ pack: def, cards: revealOrder(drawn) });
  }

  closeOpening(): void {
    this.opening.set(null);
  }

  /** The temporary development aid. Not a reward, and not a purchase. */
  grantGeo(): void {
    this.user.creditGeo(DEV_GRANT_GEO);
  }
}
