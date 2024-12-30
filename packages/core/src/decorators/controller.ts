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
  /**
   * Singleton per scope.
   * 
   * __Warn__: at the moment, this is an experimental feature.
   *
   * Default - `module`.
   */
  scope?: 'ctx';
}

/**
 * Metadata accepted by the context-scoped controller.
 */
export interface ControllerRawMetadata2 {
  /**
   * Providers per route.
   */
  providersPerRou?: Providers | Provider[];
  /**
   * __Warn__: at the moment, this is an experimental feature.
   * Default - `module`.
   */
  scope?: 'ctx';
}

export type ControllerRawMetadata = ControllerRawMetadata1 | ControllerRawMetadata2;

export const controller = makeClassDecorator((data?: ControllerRawMetadata) => data || {});
