import { makeClassDecorator } from '../di/index.js';
import { ServiceProvider } from '../types/mix.js';

export interface ControllerMetadata {
  /**
   * Providers per HTTP request.
   */
  providersPerReq?: ServiceProvider[];
  /**
   * Providers per route.
   */
  providersPerRou?: ServiceProvider[];
}

export const controller = makeClassDecorator((data?: ControllerMetadata) => data || {});
