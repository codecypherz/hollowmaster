import { Component, inject } from '@angular/core';
import { Home } from '../home/home';
import { Game } from '../game/game';
import { GameService } from '../../services/game.service';

/**
 * The player-facing route: the home screen until a game is running, the game
 * screen once it is. Lifted out of the app shell so the shell can host a
 * router outlet and other routes can exist alongside this one.
 */
@Component({
  selector: 'app-play',
  imports: [Home, Game],
  templateUrl: './play.html',
})
export class Play {
  readonly gameService = inject(GameService);

  onStartGame(): void {
    this.gameService.startGame();
  }
}
