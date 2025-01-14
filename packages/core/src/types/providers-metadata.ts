import { Provider } from '#di/types-and-models.js';
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
}
