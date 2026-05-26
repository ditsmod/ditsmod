import { injectable } from '#di/decorators.js';
import { Injector } from '#di/injector.js';
import { Provider } from '#di/top/types-and-models.js';
import { CannotReinitInjectorAfterStage1 } from '#errors';

/**
 * Used only for extensions.
 */
@injectable()
export class PerAppService {
  providers: Provider[] = [];
  #injector: Injector;
  #isClosed?: boolean;

  get injector() {
    return this.#injector;
  }

  /**
   * Applies providers per app to create new injector.
   */
  reinitInjector(providers?: Provider[]) {
    if (this.#isClosed) {
      throw new CannotReinitInjectorAfterStage1();
    }

    if (providers) {
      this.providers.push(...providers);
    }
    this.#injector = Injector.resolveAndCreate(this.providers, 'App');
    const child = this.#injector.createChildFromResolved([], 'injectorOfPerAppService');
    child.setParentGetter(() => this.#injector);
    return child;
  }

  close() {
    this.#isClosed = true;
  }
}
