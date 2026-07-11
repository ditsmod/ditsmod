import type { Provider, ProviderBuilder } from '@ditsmod/core';
import { Reflector } from '@ditsmod/core';

/**
 * Metadata accepted by the default request-scoped controller.
 */
export interface RequestScopedControllerOptions {
  /**
   * ProviderBuilder per route.
   */
  providersPerRou?: ProviderBuilder | Provider[];
  /**
   * ProviderBuilder per HTTP request.
   */
  providersPerReq?: ProviderBuilder | Provider[];
  /**
   * Indicates in which mode the controller methods work.
   *
   * The operation of the controller in `route` mode means that its methods,
   * which are bound to routes, receive a single argument - an object containing
   * context data, including native request objects.
   */
  scope?: never;
}

/**
 * Metadata accepted by the route-scoped controller.
 */
export interface RouteScopedControllerOptions {
  /**
   * ProviderBuilder per route.
   */
  providersPerRou?: ProviderBuilder | Provider[];
  /**
   * Indicates in which mode the controller methods work.
   *
   * The operation of the controller in `route` mode means that its methods,
   * which are bound to routes, receive a single argument - an object containing
   * context data, including native request objects.
   */
  scope: 'route';
}

export type ControllerOptions = RequestScopedControllerOptions | RouteScopedControllerOptions;

export const controller: ControllerDecorator = Reflector.makeClassDecorator(
  (data?: ControllerOptions) => data || {},
);

interface ControllerDecorator {
  (meta?: RequestScopedControllerOptions): any;
  (meta?: RouteScopedControllerOptions): any;
}
