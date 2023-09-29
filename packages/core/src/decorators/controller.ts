import { makeClassDecorator } from '#di';
import { ServiceProvider } from '#types/mix.js';

export interface ControllerMetadata {
  /**
   * Providers per HTTP request.
   */
  providersPerReq?: ServiceProvider[];
  /**
   * Providers per route.
   */
  providersPerRou?: ServiceProvider[];
  /**
   * Default - `false`.
   */
  isSingleton?: boolean;
}

export const controller = makeClassDecorator((data?: ControllerMetadata) => data || {});
