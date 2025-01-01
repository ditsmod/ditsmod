import { makeClassDecorator } from '#di';
import { Provider } from '#types/mix.js';
import { Providers } from '#utils/providers.js';

/**
 * Metadata accepted by the default injector-scoped controller.
 */
export interface ControllerRawMetadata1 {
  /**
   * Providers per route.
   */
  providersPerRou?: Providers | Provider[];
  /**
   * Providers per HTTP request.
   */
  providersPerReq?: Providers | Provider[];
  scope?: never;
}

/**
 * Metadata accepted by the context-scoped controller.
 */
export interface ControllerRawMetadata2 {
  /**
   * Providers per route.
   */
  providersPerRou?: Providers | Provider[];
  scope: 'ctx';
}

export type ControllerRawMetadata = ControllerRawMetadata1 | ControllerRawMetadata2;

export const controller: ControllerDecor = makeClassDecorator((data?: ControllerRawMetadata) => data || {});

interface ControllerDecor {
  (meta?: ControllerRawMetadata1): any;
  (meta?: ControllerRawMetadata2): any;
}
