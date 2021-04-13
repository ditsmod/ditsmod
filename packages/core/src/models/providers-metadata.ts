import { ServiceProvider } from '../types/mix';

export class ProvidersMetadata {
  /**
   * Providers per the application.
   */
  providersPerApp?: ServiceProvider[] = [];
  /**
   * Providers per module.
   */
  providersPerMod?: ServiceProvider[] = [];
  /**
   * Providers per route.
   */
  providersPerRou?: ServiceProvider[] = [];
  /**
   * Providers per HTTP request.
   */
  providersPerReq?: ServiceProvider[] = [];
}
