import { makeClassDecorator } from '#di';
import { Provider } from '#types/mix.js';

export interface ControllerMetadata {
  /**
   * Providers per HTTP request.
   */
  providersPerReq?: Provider[];
  /**
   * Providers per route.
   */
  providersPerRou?: Provider[];
  /**
   * Default - `false`.
   */
  isSingleton?: boolean;
}

export const controller = makeClassDecorator((data?: ControllerMetadata) => data || {});
