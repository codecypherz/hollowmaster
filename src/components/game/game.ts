import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { GameService } from '../../services/game.service';
import { CardComponent } from '../card/card';

@Component({
  selector: 'app-game',
  imports: [CardComponent],
  templateUrl: './game.html',
  styleUrl: './game.css',
})
export class Game {
  private gs = inject(GameService);
  private router = inject(Router);

  readonly state = computed(() => this.gs.state()!);
  readonly particles = Array.from({ length: 14 }, (_, i) => i);

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
