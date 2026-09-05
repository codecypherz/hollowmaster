import { Routes } from '@angular/router';
import { Play } from '../components/play/play';

export const routes: Routes = [
  { path: '', component: Play },
  {
    // Development reference only — deliberately not linked from any
    // player-facing screen, and lazy so it adds nothing to the game bundle.
    path: 'style-guide',
    loadComponent: () => import('../components/style-guide/style-guide').then((m) => m.StyleGuide),
  },
];
