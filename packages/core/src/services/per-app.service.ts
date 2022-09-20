import { Injectable, ReflectiveInjector } from '@ts-stack/di';

import { ServiceProvider } from '../types/mix';

/**
 * Used only for extensions.
 */
@Injectable()
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
   * Applies providers per app to create new injector.
   */
  reinitInjector() {
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
