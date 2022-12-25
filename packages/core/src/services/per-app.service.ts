import { injectable, ReflectiveInjector } from '@ts-stack/di';

import { ServiceProvider } from '../types/mix';

/**
 * Used only for extensions.
 */
@injectable()
export class PerAppService {
  #providers: ServiceProvider[] = [];
  #injector: ReflectiveInjector;

  /**
   * Returns copy of the providersPerApp.
   */
  get providers(): ServiceProvider[] {
    return [...this.#providers];
  }

  /**
   * Merges new providersPerApp with existing providersPerApp.
   */
  set providers(providers: ServiceProvider[]) {
    this.#providers.push(...providers);
  }

  /**
   * Applies providers per app to create new injector. You probably don't need to use this method.
   * At the moment, it is used after the work of all extensions that may have been dynamically
   * added new providers.
   */
  reinitInjector(providers?: ServiceProvider[]) {
    if (providers) {
      this.providers = providers;
    }
    this.#injector = ReflectiveInjector.resolveAndCreate(this.providers);
    return this.#injector;
  }

  get injector() {
    return this.#injector;
  }

  removeProviders() {
    this.#providers = [];
  }
}
