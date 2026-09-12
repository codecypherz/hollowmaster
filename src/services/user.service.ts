import { Injectable, computed, inject, signal } from '@angular/core';
import { Card } from '../model/card';
import { addCardToDeck, createDeck, deleteDeck, removeCardFromDeck } from '../model/deck';
import {
  SCHEMA_VERSION,
  UserState,
  distinctCards,
  fromPersisted,
  grantAll,
  seedUser,
  toPersisted,
  totalCards as countTotal,
} from '../model/user';
import { USER_STORE } from './user-store';

/**
 * The one user. There is no sign-in and no identity — the application never
 * asks who is playing — so this holds a single state and every surface that
 * spends, earns, or grants reads the same signal.
 *
 * Shaped after `GameService`: one private signal, a readonly projection, and
 * `computed` for everything derivable, so the balance and the counts cannot
 * drift from the state they come from.
 */
@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly store = inject(USER_STORE);
  private readonly _state = signal<UserState>(seedUser());

  readonly state = this._state.asReadonly();
  readonly geo = computed(() => this._state().geo);
  readonly collection = computed(() => this._state().collection);

  /** The decks the player has built, in their own order. */
  readonly decks = computed(() => this._state().decks);

  /** Every copy of every card held. */
  readonly totalCards = computed(() => countTotal(this._state().collection));

  /** How many different cards are held, regardless of quantity. */
  readonly distinctCards = computed(() => distinctCards(this._state().collection));

  /**
   * Restores the stored user, or seeds a fresh one.
   *
   * Called once from `provideAppInitializer`, so the application is held until
   * the user is resolved and no component ever sees a loading state. A record
   * that is absent, unreadable, of an unrecognised version, or structurally
   * invalid all arrive here as `null` and take the same route: a new player.
   *
   * The seeded user is written straight back, so a second load restores it
   * rather than reseeding.
   */
  async load(): Promise<void> {
    // The port's contract is that neither method rejects, but bootstrap waits
    // on this: an adapter that breaks that contract would leave the
    // application with no user at all rather than with a new one.
    const persisted = await this.store.load().catch(() => null);
    if (persisted) {
      this._state.set(fromPersisted(persisted));
      // A record read at an earlier version was upgraded on the way in. Write
      // it straight back so the shape settles without the player taking an
      // action, and so a read-only session leaves a current record behind.
      if (persisted.version !== SCHEMA_VERSION) this.persist();
      return;
    }
    this._state.set(seedUser());
    this.persist();
  }

  /** Adds Geo to the purse. A non-positive amount is not a credit and is refused. */
  creditGeo(amount: number): void {
    if (!Number.isInteger(amount) || amount <= 0) return;
    this._state.update((s) => ({ ...s, geo: s.geo + amount }));
    this.persist();
  }

  /** Adds cards to the collection, raising the quantity of any already held. */
  grantCards(cards: readonly Card[]): void {
    if (cards.length === 0) return;
    this._state.update((s) => ({ ...s, collection: grantAll(s.collection, cards) }));
    this.persist();
  }

  /**
   * Spends `price` in exchange for `cards`, or does nothing.
   *
   * There is deliberately no public `spendGeo`: every spend in the application
   * is a purchase, and a bare deduction is exactly how the balance and the
   * collection come apart. The deduction and the grant are applied in one
   * `update()`, so no consumer of the signal can observe the Geo gone with the
   * cards not yet arrived.
   *
   * Returns whether the purchase happened.
   */
  purchase(price: number, cards: readonly Card[]): boolean {
    if (!Number.isInteger(price) || price < 0) return false;
    if (this._state().geo < price) return false;

    this._state.update((s) => ({
      ...s,
      geo: s.geo - price,
      collection: grantAll(s.collection, cards),
    }));
    this.persist();
    return true;
  }

  // ─── Decks ────────────────────────────────────────────────────────────────
  //
  // Each command applies the matching pure function from `deck.ts` and does
  // nothing else: every rule — the deck limit, the deck size, the unlocked
  // gate, the position bounds — lives there, and `null` from there is a
  // refusal that must cost no write. Each returns whether the change happened.

  /** Appends an empty deck. Refused at the deck limit. */
  createDeck(): boolean {
    return this.apply((s) => createDeck(s));
  }

  /** Removes that deck and the cards it held. Refused for a deck not held. */
  deleteDeck(deckIndex: number): boolean {
    return this.apply((s) => deleteDeck(s, deckIndex));
  }

  /**
   * Puts `card` in that deck's first free position. Refused for a deck not
   * held, a full deck, or a card the collection does not hold. The collection
   * is not touched: a card added to a deck is not spent.
   */
  addCardToDeck(deckIndex: number, card: Card): boolean {
    return this.apply((s) => addCardToDeck(s, deckIndex, card));
  }

  /** Takes out the card at that position. Refused for a position not occupied. */
  removeCardFromDeck(deckIndex: number, position: number): boolean {
    return this.apply((s) => removeCardFromDeck(s, deckIndex, position));
  }

  /**
   * Commits a deck operation's result, or reports that it did not happen.
   *
   * A refusal persists nothing: the state is unchanged, so a write would be a
   * no-op that still costs a round trip to the store.
   */
  private apply(operation: (state: UserState) => UserState | null): boolean {
    let applied = false;
    this._state.update((s) => {
      const next = operation(s);
      if (!next) return s;
      applied = true;
      return next;
    });
    if (applied) this.persist();
    return applied;
  }

  /**
   * Writes the current state out, fire and forget.
   *
   * Neither the resolution nor the rejection is waited on: the player takes no
   * save action, there is no unsaved state to present, and a store that
   * refuses a write must not take the application down with it. The `catch`
   * exists only so a rejecting store raises no unhandled rejection.
   */
  private persist(): void {
    void this.store.save(toPersisted(this._state())).catch(() => {});
  }
}
