import type { ForwardRefFn } from '#di/forward-ref.js';
import type { Provider } from '#di/top/types-and-models.js';
import type { ProviderBuilder } from '#utils/providers.js';

export class ProvidersByLevel<T = ProviderBuilder | (Provider | ForwardRefFn<Provider>)[]> {
  /**
   * ProviderBuilder per the application.
   */
  providersPerApp = [] as T;
  /**
   * ProviderBuilder per a module.
   */
  providersPerMod = [] as T;
  /**
   * ProviderBuilder per a route.
   */
  providersPerRou = [] as T;
  /**
   * ProviderBuilder per a request.
   */
  providersPerReq = [] as T;
}
