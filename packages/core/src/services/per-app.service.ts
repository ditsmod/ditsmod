import { injectable, Injector } from '#di';
import { Provider } from '#types/mix.js';

/**
 * Used only for extensions.
 */
@injectable()
export class PerAppService {
  providers: Provider[] = [];
  #injector: Injector;

  /**
   * Applies providers per app to create new injector. You probably don't need to use this method.
   * At the moment, it is used after the work of all extensions that may have been dynamically
   * added new providers.
   * 
   * __WARNING!__ Using this method, it is very easy to make an inconspicuous mistake.
   * This is due to unintentional duplication of injector trees. Please do not use this
   * method unless you clearly understand that injector tree duplication does not occur.
   */
  reinitInjector(providers?: Provider[]) {
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
