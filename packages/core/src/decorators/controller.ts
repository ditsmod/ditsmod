import { makeClassDecorator } from '@ts-stack/di';

import { ServiceProvider } from '../types/mix';

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
