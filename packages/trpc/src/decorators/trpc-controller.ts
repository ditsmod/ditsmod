import type { Provider, ProviderBuilder } from '@ditsmod/core';
import { Reflector } from '@ditsmod/core';

/**
 * Metadata accepted by the default request-scoped trpcController.
 */
export interface ControllerDecoratorOptions {
  /**
   * ProviderBuilder per route.
   */
  providersPerRou?: ProviderBuilder | Provider[];
  /**
   * ProviderBuilder per HTTP request.
   */
  providersPerReq?: ProviderBuilder | Provider[];
}

export const trpcController: ControllerDecor = Reflector.makeClassDecorator(
  (data?: ControllerDecoratorOptions) => data || {},
  'trpcController',
);

interface ControllerDecor {
  (meta?: ControllerDecoratorOptions): any;
}
