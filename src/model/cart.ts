import { Card, CardKey, cardKey } from './card';
import { ExchangeAction, OrderLine } from './exchange';

/**
 * One card pending in the cart. The cart is an order not yet settled, so its
 * lines are the order's lines: confirming hands them over as they are.
 */
export type CartLine = OrderLine;

/** The most copies of one card that may be pending for purchase. */
export const MAX_PENDING_BUY = 99;

/** Why a card whose rate is not known cannot be bought. */
export const RATE_UNKNOWN = 'You do not know its price yet';

/**
 * The most copies that may be pending in that direction: every copy held for a
 * sale, and `MAX_PENDING_BUY` for a purchase, or none where the player does not
 * know the card's rate. The balance is not a bound — what is affordable is
 * decided on the whole cart's net.
 */
export function maxPending(action: ExchangeAction, held: number, rateKnown: boolean): number {
  if (action === 'sell') return held;
  return rateKnown ? MAX_PENDING_BUY : 0;
}

/** Why one more copy cannot be pending, or empty when it can. */
export function raiseRefusal(
  action: ExchangeAction,
  held: number,
  quantity: number,
  rateKnown: boolean,
): string {
  if (quantity < maxPending(action, held, rateKnown)) return '';
  if (action === 'buy' && !rateKnown) return RATE_UNKNOWN;
  if (action === 'buy') return `${MAX_PENDING_BUY} is the most that can be pending`;
  return held === 0 ? 'You hold none to sell' : 'Every copy you hold is pending';
}

/** How many copies of that card are pending in that direction. */
export function quantityFor(
  lines: readonly CartLine[],
  key: CardKey,
  action: ExchangeAction,
): number {
  return lines.find((line) => line.key === key && line.action === action)?.quantity ?? 0;
}

/**
 * The lines with that card's quantity set in that direction, clamped to its
 * bound. Any quantity above zero replaces whatever the card had pending, in
 * the line's own place; zero takes the line out. Setting a direction the card
 * is not pending in to zero changes nothing, so it cannot clear the other.
 */
export function setQuantity(
  lines: readonly CartLine[],
  key: CardKey,
  action: ExchangeAction,
  quantity: number,
  held: number,
  rateKnown: boolean,
): readonly CartLine[] {
  const max = maxPending(action, held, rateKnown);
  const clamped = Math.min(Math.max(0, Math.trunc(quantity)), max);
  const index = lines.findIndex((line) => line.key === key);

  if (clamped === 0) {
    return index >= 0 && lines[index].action === action ? remove(lines, key) : lines;
  }
  const line: CartLine = { key, action, quantity: clamped };
  if (index < 0) return [...lines, line];
  return lines.map((existing, i) => (i === index ? line : existing));
}

/** The lines without that card's. */
export function remove(lines: readonly CartLine[], key: CardKey): readonly CartLine[] {
  return lines.filter((line) => line.key !== key);
}

/** The lines with no sale above the copies held: each reduced to them, or dropped at none. */
export function withinHeld(
  lines: readonly CartLine[],
  heldOf: (key: CardKey) => number,
): readonly CartLine[] {
  return lines.flatMap((line) => {
    if (line.action === 'buy') return [line];
    const quantity = Math.min(line.quantity, heldOf(line.key));
    return quantity === 0 ? [] : [{ ...line, quantity }];
  });
}

// ─── Wording ────────────────────────────────────────────────────────────────
//
// Shared by the tile's rows and the dialog's, so the two name the same control
// and announce the same change in the same words.

/** What one change to the cart did. */
export interface CartChange {
  readonly card: Card;
  readonly action: ExchangeAction;
  /** The quantity pending in `action` after the change. */
  readonly quantity: number;
  /** Whether the change cleared something pending the other way. */
  readonly cleared: boolean;
}

const NOUN: Readonly<Record<ExchangeAction, string>> = { sell: 'sale', buy: 'purchase' };

/** The change as assistive technology is told it. */
export function changeText(change: CartChange): string {
  const { card, action, quantity, cleared } = change;
  const now = `${quantity} ${card.name} pending for ${NOUN[action]}.`;
  return cleared
    ? `${now} Its pending ${NOUN[action === 'sell' ? 'buy' : 'sell']} was cleared.`
    : now;
}

/** The word a surface leads a row with. */
export function actionLabel(action: ExchangeAction): string {
  return action === 'sell' ? 'Sell' : 'Buy';
}

export function raiseLabel(action: ExchangeAction, card: Card): string {
  return `${actionLabel(action)} one more ${card.name}`;
}

export function lowerLabel(action: ExchangeAction, card: Card): string {
  return `${actionLabel(action)} one fewer ${card.name}`;
}

/** What a row's quantity field is called. */
export function quantityLabel(action: ExchangeAction, card: Card): string {
  return `Copies of ${card.name} to ${action}`;
}

/** A DOM-safe form of a card's key, for ids and `data-` hooks. */
export function cardSlug(card: Card): string {
  return cardKey(card).replace('#', '-');
}
