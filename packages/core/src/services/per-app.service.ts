import { injectable, Injector } from '../di/index.js';
import { ServiceProvider } from '../types/mix.js';

/**
 * Used only for extensions.
 */
@injectable()
export class PerAppService {
  providers: ServiceProvider[] = [];
  #injector: Injector;

  /**
   * Applies providers per app to create new injector. You probably don't need to use this method.
   * At the moment, it is used after the work of all extensions that may have been dynamically
   * added new providers.
   */
  reinitInjector(providers?: ServiceProvider[]) {
    if (providers) {
      this.providers.push(...providers);
    }
    this.#injector = Injector.resolveAndCreate(this.providers, 'injectorPerApp');
    return this.#injector;
  }

  get injector() {
    return this.#injector;
  }
}
