import { Injectable, Optional, SkipSelf } from 'ts-di';

import { provideRoutes, ROUTER_FORROOT_GUARD, provideForRootGuard } from './utils/ng-utils';
import { Route, ModuleWithProviders } from './types/types';
import { AppRouter } from './app-router';

@Injectable()
export class AppRouterModule {
  /**
   * Creates and configures a module with all the router providers and directives.
   * Optionally sets up an application listener to perform an initial navigation.
   *
   * @param routes An array of `Route` objects that define the navigation paths for the application.
   * @return The new router module.
   */
  static forRoot(routes: Route[]): ModuleWithProviders<AppRouterModule> {
    return {
      module: AppRouterModule,
      providers: [
        provideRoutes(routes),
        {
          provide: ROUTER_FORROOT_GUARD,
          useFactory: provideForRootGuard,
          deps: [[AppRouter, new Optional(), new SkipSelf()]]
        }
        // ROUTER_PROVIDERS,
        // { provide: ROUTER_CONFIGURATION, useValue: config ? config : {} }
      ]
    };
  }

  /**
   * Creates a module with all the router directives and a provider registering routes.
   */
  static forChild(routes: Route[]): ModuleWithProviders<AppRouterModule> {
    return { module: AppRouterModule, providers: [provideRoutes(routes)] };
  }
}
