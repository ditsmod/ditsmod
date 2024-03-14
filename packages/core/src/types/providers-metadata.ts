import { Provider } from '#types/mix.js';

export class ProvidersMetadata {
  /**
   * Providers per the application.
   */
  providersPerApp: Provider[] = [];
  /**
   * Providers per a module.
   */
  providersPerMod: Provider[] = [];
  /**
   * Providers per route.
   */
  providersPerRou: Provider[] = [];
  /**
   * Providers per HTTP request.
   */
  providersPerReq: Provider[] = [];
}
