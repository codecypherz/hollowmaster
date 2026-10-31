import { Routes } from '@angular/router';
import { Battle } from '../components/battle/battle';
import { Game } from '../components/game/game';
import { gameActiveGuard } from './game-active.guard';

export const routes: Routes = [
  // The default destination is named rather than hosted at '' directly, so the
  // nav's link, the wildcard redirect, and the guard's fallback all name it
  // with the same string.
  { path: '', redirectTo: 'battle', pathMatch: 'full' },

  // Battle and Game are eager: Battle is the first paint, and Game must appear
  // the instant a battle starts. Everything else can wait on a chunk.
  { path: 'battle', component: Battle },
  { path: 'game', component: Game, canActivate: [gameActiveGuard] },

  {
    path: 'shop',
    loadComponent: () => import('../components/shop/shop').then((m) => m.Shop),
  },
  {
    path: 'decks',
    loadComponent: () => import('../components/decks/decks').then((m) => m.Decks),
  },
  // The Decks page was the Cards page; an address saved before the rename still lands there.
  { path: 'cards', redirectTo: 'decks' },
  {
    // Development reference only — deliberately not linked from any
    // player-facing screen, and lazy so it adds nothing to the game bundle.
    path: 'style-guide',
    loadComponent: () => import('../components/style-guide/style-guide').then((m) => m.StyleGuide),
  },

  { path: '**', redirectTo: 'battle' },
];
