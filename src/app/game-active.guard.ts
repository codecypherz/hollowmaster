import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { GameService } from '../services/game.service';

/**
 * Guards the in-game route: it may only render while a game is in progress.
 *
 * Reaching it with no game — a direct URL, a reload, a stale history entry —
 * yields a UrlTree back to the Battle page rather than `false`, so the player
 * lands somewhere real instead of on a cancelled navigation. The guard reads
 * the game state and never starts one.
 */
export const gameActiveGuard: CanActivateFn = () =>
  inject(GameService).isActive() || inject(Router).createUrlTree(['/battle']);
