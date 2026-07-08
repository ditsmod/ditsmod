import type { Provider, Providers } from '@ditsmod/core';
import { Reflector } from '@ditsmod/core';

/**
 * Metadata accepted by the default request-scoped trpcController.
 */
export interface ControllerDecoratorOptions {
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
  (data?: ControllerDecoratorOptions) => data || {},
  'trpcController',
);

interface ControllerDecor {
  (meta?: ControllerDecoratorOptions): any;
}
