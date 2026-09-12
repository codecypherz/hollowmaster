import { Component, computed, inject, signal } from '@angular/core';
import { createParticleField, particleVars } from '../../model/particle';
import { Card, CARD_DB } from '../../model/card';
import {
  PACKS,
  PACK_SIZE,
  PackDefinition,
  chanceOfAtLeast,
  drawPack,
  revealOrder,
  totalWeight,
} from '../../model/pack';
import { UserService } from '../../services/user.service';
import { PackOpening } from '../pack-opening/pack-opening';

/**
 * How much Geo the development grant credits. One Level 3 pack, so a tester
 * reaches the most interesting odds in a single click.
 */
const DEV_GRANT_GEO = 500;

/** A pack as the storefront presents it: the definition, plus what it costs today. */
interface Ware {
  readonly def: PackDefinition;
  readonly odds: string;
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
  imports: [PackOpening],
  templateUrl: './shop.html',
  styleUrl: './shop.css',
})
export class Shop {
  private readonly user = inject(UserService);

  readonly particles = createParticleField(14, 0x5409);
  readonly vars = particleVars;

  /** The player's purse. Named Geo on the page; zero shows as zero. */
  readonly geo = this.user.geo;

  readonly packSize = PACK_SIZE;
  readonly grantAmount = DEV_GRANT_GEO;

  /**
   * The three tiers in ascending price order, each carrying the sentence that
   * tells it apart from its neighbours. The order comes from the price rather
   * than from the order they happen to be declared in.
   */
  readonly wares: readonly Ware[] = [...PACKS]
    .sort((a, b) => a.price - b.price)
    .map((def) => ({ def, odds: oddsFor(def) }));

  /** The cards of the pack being opened, or null when the storefront is at rest. */
  readonly opening = signal<readonly Card[] | null>(null);

  /** Every pack the purse cannot currently reach. */
  readonly unaffordable = computed(() => {
    const geo = this.user.geo();
    return new Set(this.wares.filter((w) => w.def.price > geo).map((w) => w.def.id));
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
    this.opening.set(revealOrder(drawn));
  }

  closeOpening(): void {
    this.opening.set(null);
  }

  /** The temporary development aid. Not a reward, and not a purchase. */
  grantGeo(): void {
    this.user.creditGeo(DEV_GRANT_GEO);
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * How a tier describes its own odds, derived from its weight table rather than
 * written out beside it — so retuning the table retunes the sentence, and the
 * three can never claim to differ in a way they no longer do.
 */
export function oddsFor(def: PackDefinition): string {
  const rare = Math.round(chanceOfAtLeast(def, 4) * 100);
  const common = Math.round((def.weights[1] / totalWeight(def)) * 100);
  return `${rare}% four-star or better, ${common}% one-star`;
}
