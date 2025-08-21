import { ForwardRefFn } from '#di/forward-ref.js';
import { Provider } from '#di/types-and-models.js';
import { Providers } from '#utils/providers.js';

export class ProvidersOnly<T = Providers | (Provider | ForwardRefFn<Provider>)[]> {
  /**
   * Providers per the application.
   */
  providersPerApp = [] as T;
  /**
   * Providers per a module.
   */
  providersPerMod = [] as T;
}
