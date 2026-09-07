import { Component, DestroyRef, ElementRef, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { GameService } from '../../services/game.service';
import { CardComponent } from '../card/card';
import { fitArena, type ArenaGeometry } from '../../model/arena';
import { createParticleField, particleVars } from '../../model/particle';

@Component({
  selector: 'app-game',
  imports: [CardComponent],
  templateUrl: './game.html',
  styleUrl: './game.css',
})
export class Game {
  private gs = inject(GameService);
  private router = inject(Router);
  private host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly state = computed(() => this.gs.state()!);
  readonly scores = this.gs.scores;
  readonly particles = createParticleField(14, 0xa17);
  readonly vars = particleVars;

  /* The arena's fit, refreshed on every host resize. Seeded rather than left
     empty so the first painted frame is already laid out at a sane unit; the
     observer's initial callback replaces it with the measured one. */
  private readonly geometry = signal<ArenaGeometry>(fitArena(1920, 1080));

  /** `--cw`: a card's laid-out width, in CSS pixels. */
  readonly cardUnit = computed(() => this.geometry().unit);

  /** `--arena-scale`: the uniform viewing transform, `1` when the arena fits. */
  readonly arenaScale = computed(() => this.geometry().scale);

  constructor() {
    /* Observe the host, write to `.arena`. The host is sized by the viewport
       alone — `100dvh` tall, `overflow: hidden` — so nothing the geometry puts
       on the inner element can feed back into what is being measured, and the
       observer settles after one callback per resize instead of oscillating.

       A `ResizeObserver` rather than a `window` resize listener: it also
       catches the host changing size without the window doing so, and it
       delivers the first measurement itself, so there is no separate
       measure-on-init path to keep in step with this one. */
    if (typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      this.geometry.set(fitArena(width, height));
    });
    observer.observe(this.host.nativeElement);
    inject(DestroyRef).onDestroy(() => observer.disconnect());
  }

  onCardSelect(index: number): void {
    this.gs.selectCard(index);
  }

  onCellClick(row: number, col: number): void {
    const s = this.state();
    if (s.phase !== 'player-turn' || s.selectedCardIndex === null) return;
    if (s.board[row][col] !== null) return;
    this.gs.placeCard(row, col);
  }

  exitGame(): void {
    // Clear the state before navigating, so the in-game route's guard cannot
    // see a stale active game and send the player straight back in.
    this.gs.exitGame();
    this.router.navigate(['/battle']);
  }

  playAgain(): void {
    this.gs.startGame();
  }

  isPlaceable(row: number, col: number): boolean {
    const s = this.state();
    return s.phase === 'player-turn' && s.selectedCardIndex !== null && s.board[row][col] === null;
  }

  isFlipped(row: number, col: number): boolean {
    return this.state().lastFlipped.some((f) => f.row === row && f.col === col);
  }

  statusText(): string {
    const s = this.state();
    if (s.phase === 'player-turn') return 'Your Turn';
    if (s.phase === 'opponent-turn') return 'The Pale Court Ponders...';
    return '';
  }

  resultText(): string {
    const w = this.state().winner;
    if (w === 'player') return 'Soul Restored — Victory';
    if (w === 'opponent') return 'Shade Lingers — Defeat';
    return 'The Void Holds — Draw';
  }
}
