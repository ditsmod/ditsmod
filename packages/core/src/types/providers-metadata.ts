import { Provider } from '#types/mix.js';
import { Providers } from '#utils/providers.js';

export class ProvidersMetadata {
  /**
   * Providers per the application.
   */
  providersPerApp: Providers | Provider[] = [];
  /**
   * Providers per a module.
   */
  providersPerMod: Providers | Provider[] = [];
  /**
   * Providers per route.
   */
  providersPerRou: Providers | Provider[] = [];
  /**
   * Providers per HTTP request.
   */
  providersPerReq: Providers | Provider[] = [];
}
