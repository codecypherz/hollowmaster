import { Component, ElementRef, computed, effect, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CARD_BY_KEY, Card } from '../../model/card';
import { defaultBattleDeck, isBattleReady } from '../../model/deck';
import { createParticleField, particleVars } from '../../model/particle';
import { GameService } from '../../services/game.service';
import { UserService } from '../../services/user.service';
import { CardReader } from '../card-reader/card-reader';
import { DeckBar } from '../deck-bar/deck-bar';

/**
 * Deck selection: between the Battle page and a match.
 *
 * It shows the player's decks, lets them choose a Ready one and read its
 * cards, and begins the battle with it. It never changes a deck — the deck bar
 * is in its read-only `choose` mode, and the only write is the remembered
 * battle deck.
 *
 * Which decks may be chosen is `isBattleReady`, and nothing else: the page
 * never decides eligibility on its own.
 */
@Component({
  selector: 'app-deck-select',
  imports: [CardReader, DeckBar, RouterLink],
  templateUrl: './deck-select.html',
  styleUrl: './deck-select.css',
})
export class DeckSelect {
  private readonly users = inject(UserService);
  private readonly game = inject(GameService);
  private readonly router = inject(Router);
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);

  readonly particles = createParticleField(14, 0xdec5);
  readonly vars = particleVars;
  readonly eligible = isBattleReady;

  readonly decks = this.users.decks;

  /** Why the battle cannot begin with nothing chosen — its description. */
  readonly beginReason = 'Choose a ready deck to battle';

  /** The deck on screen: the remembered one if Ready, else the first Ready one, else none. */
  readonly chosen = signal<number | null>(defaultBattleDeck(this.users.state()));

  /** The position in the chosen deck whose card is being read, at most one. */
  readonly reading = signal<number | null>(null);

  readonly readingCard = computed<Card | null>(() => {
    const position = this.reading();
    const index = this.chosen();
    if (position === null || index === null) return null;
    const key = this.decks()[index]?.cards[position];
    return key ? (CARD_BY_KEY.get(key) ?? null) : null;
  });

  constructor() {
    // Nothing on this page changes a deck, but a deck can still change under
    // it. A chosen index that no longer names a Ready deck is re-derived
    // rather than kept, so it never silently names a different deck.
    effect(() => {
      const decks = this.decks();
      const index = this.chosen();
      if (index !== null && decks[index] && isBattleReady(decks[index])) return;
      const fallback = defaultBattleDeck(this.users.state());
      if (fallback !== index) this.chosen.set(fallback);
    });
  }

  /** Choosing a deck records it at once; the deck bar emits only for eligible decks. */
  onChoose(index: number): void {
    if (!this.users.chooseBattleDeck(index)) return;
    this.chosen.set(index);
    this.reading.set(null);
  }

  /** Records the chosen deck, begins the match with it, and moves to the in-game route. */
  begin(): void {
    const index = this.chosen();
    if (index === null) return;
    if (!this.users.chooseBattleDeck(index)) return;
    const deck = this.decks()[index];
    if (!this.game.startGame(deck)) return;
    this.router.navigate(['/game']);
  }

  onRead(position: number): void {
    this.reading.set(position);
  }

  /** Closes the reader, handing focus back to the card it was opened from. */
  closeReader(): void {
    const position = this.reading();
    this.reading.set(null);
    if (position === null) return;
    queueMicrotask(() => {
      this.host.nativeElement
        .querySelector<HTMLElement>(
          `app-deck-bar .slot:nth-child(${position + 1}) .slot-card button`,
        )
        ?.focus({ preventScroll: true });
    });
  }
}
