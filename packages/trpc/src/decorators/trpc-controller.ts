import type { Provider, Providers } from '@ditsmod/core';
import { Reflector } from '@ditsmod/core';

/**
 * Metadata accepted by the default injector-scoped trpcController.
 */
export interface ControllerRawMetadata {
  /**
   * Providers per route.
   */
  providersPerRou?: Providers | Provider[];
  /**
   * Providers per HTTP request.
   */
  providersPerReq?: Providers | Provider[];
}

export const trpcController: ControllerDecor = Reflector.makeClassDecorator(
  (data?: ControllerRawMetadata) => data || {},
  'trpcController',
);

interface ControllerDecor {
  (meta?: ControllerRawMetadata): any;
}
