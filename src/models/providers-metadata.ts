import { ServiceProvider } from '../types/service-provider';

export class ProvidersMetadata {
  /**
   * Providers per the application.
   */
  providersPerApp: ServiceProvider[] = [];
  /**
   * Providers per module.
   */
  providersPerMod: ServiceProvider[] = [];
  /**
   * Providers per HTTP request.
   */
  providersPerReq: ServiceProvider[] = [];
}
