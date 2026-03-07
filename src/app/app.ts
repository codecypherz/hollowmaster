import { Component, inject } from '@angular/core';
import { Home } from '../components/home/home';
import { Game } from '../components/game/game';
import { GameService } from '../services/game.service';

@Component({
  selector: 'app-root',
  imports: [Home, Game],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  readonly gameService = inject(GameService);

  onStartGame(): void {
    this.gameService.startGame();
  }
}
