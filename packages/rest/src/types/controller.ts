import type { Provider, Providers } from '@ditsmod/core';
import { Reflector } from '@ditsmod/core';

/**
 * Metadata accepted by the default request-scoped controller.
 */
export interface ControllerDecoratorOptions1 {
  /**
   * Providers per route.
   */
  providersPerRou?: Providers | Provider[];
  /**
   * Providers per HTTP request.
   */
  providersPerReq?: Providers | Provider[];
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
export interface ControllerDecoratorOptions2 {
  /**
   * Providers per route.
   */
  providersPerRou?: Providers | Provider[];
  /**
   * Indicates in which mode the controller methods work.
   *
   * The operation of the controller in `route` mode means that its methods,
   * which are bound to routes, receive a single argument - an object containing
   * context data, including native request objects.
   */
  scope: 'route';
}

export type ControllerDecoratorOptions = ControllerDecoratorOptions1 | ControllerDecoratorOptions2;

export const controller: ControllerDecor = Reflector.makeClassDecorator((data?: ControllerDecoratorOptions) => data || {});

interface ControllerDecor {
  (meta?: ControllerDecoratorOptions1): any;
  (meta?: ControllerDecoratorOptions2): any;
}
