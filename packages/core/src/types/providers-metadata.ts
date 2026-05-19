import type { ForwardRefFn } from '#di/forward-ref.js';
import type { Provider } from '#di/top/types-and-models.js';
import type { Providers } from '#utils/providers.js';

export class ProvidersOnly<T = Providers | (Provider | ForwardRefFn<Provider>)[]> {
  /**
   * Providers per the application.
   */
  providersPerApp = [] as T;
  /**
   * Providers per a module.
   */
  providersPerMod = [] as T;
  /**
   * Providers per a route.
   */
  providersPerRou = [] as T;
  /**
   * Providers per a request.
   */
  providersPerReq = [] as T;
}
