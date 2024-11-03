import { makeClassDecorator } from '#di';
import { Provider } from '#types/mix.js';

/**
 * Metadata accepted by the default (non-singleton) controller.
 */
export interface ControllerRawMetadata1 {
  /**
   * Providers per HTTP request.
   */
  providersPerReq?: Provider[];
  /**
   * Providers per route.
   */
  providersPerRou?: Provider[];
  /**
   * Singleton per scope.
   * 
   * __Warn__: at the moment, this is an experimental feature.
   *
   * Default - `module`.
   */
  singleton?: 'module';
}

/**
 * Metadata accepted by the singleton controller.
 */
export interface ControllerRawMetadata2 {
  /**
   * Providers per route.
   */
  providersPerRou?: Provider[];
  /**
   * __Warn__: at the moment, this is an experimental feature.
   * Default - `module`.
   */
  singleton?: 'module';
}

export type ControllerRawMetadata = ControllerRawMetadata1 | ControllerRawMetadata2;

export const controller = makeClassDecorator((data?: ControllerRawMetadata) => data || {});
