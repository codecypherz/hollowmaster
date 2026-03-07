import { Component, computed, inject } from '@angular/core';
import { GameService } from '../../services/game.service';
import { Card } from '../../model/card';
import { PlacedCard } from '../../model/game';

// 3×3 grid layout: NW N NE / W · E / SW S SE  (null = center)
const ARROW_GRID = ['NW', 'N', 'NE', 'W', null, 'E', 'SW', 'S', 'SE'] as const;

@Component({
  selector: 'app-game',
  imports: [],
  templateUrl: './game.html',
  styleUrl: './game.css',
})
export class Game {
  private gs = inject(GameService);

  readonly state = computed(() => this.gs.state()!);
  readonly arrowGrid = ARROW_GRID;
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
    this.gs.exitGame();
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

  hasArrow(card: Card, dir: string): boolean {
    return card.stats.arrows.includes(dir as any);
  }

  toHex(n: number): string {
    return n.toString(16).toUpperCase();
  }

  statusText(): string {
    const s = this.state();
    if (s.phase === 'player-turn') return 'Your Turn';
    if (s.phase === 'opponent-turn') return "The Pale Court Ponders...";
    return '';
  }

  resultText(): string {
    const w = this.state().winner;
    if (w === 'player') return 'Soul Restored — Victory';
    if (w === 'opponent') return 'Shade Lingers — Defeat';
    return 'The Void Holds — Draw';
  }

  cardImageStyle(card: Card): string {
    return `url('${card.image}')`;
  }

  trackByIndex(index: number): number {
    return index;
  }
}
