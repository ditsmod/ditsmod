import { makeClassDecorator, Provider, Providers } from '@ditsmod/core';

/**
 * Metadata accepted by the default injector-scoped controller.
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

export const controller: ControllerDecor = makeClassDecorator((data?: ControllerRawMetadata) => data || {});

interface ControllerDecor {
  (meta?: ControllerRawMetadata): any;
}
