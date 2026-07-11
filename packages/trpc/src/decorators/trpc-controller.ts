import type { Provider, ProviderBuilder } from '@ditsmod/core';
import { Reflector } from '@ditsmod/core';

/**
 * Metadata accepted by the default request-scoped trpcController.
 */
export interface ControllerOptions {
  /**
   * ProviderBuilder per route.
   */
  providersPerRou?: ProviderBuilder | Provider[];
  /**
   * ProviderBuilder per HTTP request.
   */
  providersPerReq?: ProviderBuilder | Provider[];
}

export const trpcController: ControllerDecorator = Reflector.makeClassDecorator(
  (data?: ControllerOptions) => data || {},
  'trpcController',
);

interface ControllerDecorator {
  (meta?: ControllerOptions): any;
}
