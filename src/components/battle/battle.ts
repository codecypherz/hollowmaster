import { Component, inject, output } from '@angular/core';
import { Router } from '@angular/router';
import { GameService } from '../../services/game.service';

@Component({
  selector: 'app-battle',
  imports: [],
  templateUrl: './battle.html',
  styleUrl: './battle.css',
})
export class Battle {
  private readonly gameService = inject(GameService);
  private readonly router = inject(Router);

  particles = Array.from({ length: 22 }, (_, i) => i);

  /**
   * The template still only announces the intent to battle; the handler that
   * starts the game and moves to the in-game route lives here rather than in a
   * parent, since this component owns the route the intent originates from.
   */
  readonly startGame = output<void>();

  constructor() {
    this.startGame.subscribe(() => {
      this.gameService.startGame();
      this.router.navigate(['/game']);
    });
  }
}
