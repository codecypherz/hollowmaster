import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { UserService } from '../services/user.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // The user is resolved before the first paint, so no screen ever renders
    // against a placeholder and no signal publishes one. With `localStorage`
    // behind the port this resolves in a microtask; a future network adapter
    // is what turns this wait into a splash, which is the right place for it.
    provideAppInitializer(() => inject(UserService).load()),
  ],
};
