import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { provideRouter } from '@angular/router';
import { gameActiveGuard } from './game-active.guard';
import { GameService } from '../services/game.service';
import { routes } from './app.routes';

describe('gameActiveGuard', () => {
  let router: Router;
  let gameService: GameService;

  function run() {
    return TestBed.runInInjectionContext(() => gameActiveGuard(null as never, null as never));
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
    router = TestBed.inject(Router);
    gameService = TestBed.inject(GameService);
  });

  it('allows the in-game route while a game is in progress', () => {
    gameService.startGame();
    expect(run()).toBe(true);
  });

  it('redirects to the Battle page when no game is in progress', () => {
    const result = run();
    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe('/battle');
  });

  it('starts no game as a side effect of redirecting', () => {
    run();
    expect(gameService.isActive()).toBe(false);
  });
});
