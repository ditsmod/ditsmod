import { Provider } from '#di/types-and-models.js';
import { Providers } from '#utils/providers.js';

export class ProvidersOnly {
  /**
   * Providers per the application.
   */
  providersPerApp: Providers | Provider[] = [];
  /**
   * Providers per a module.
   */
  providersPerMod: Providers | Provider[] = [];
}
