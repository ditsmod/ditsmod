import type { HttpMethod, NormalizedGuard, Provider } from './mix.js';
import type { RouteMeta } from './route-data.js';

export interface ControllerMetadata {
  /**
   * Providers per a route.
   */
  providersPerRou: Provider[];
  /**
   * Providers per a request.
   */
  providersPerReq: Provider[];
  path: string;
  httpMethod: HttpMethod;
  routeMeta: RouteMeta;
  /**
   * Singleton per scope.
   * 
   * __Warn__: for now, is experimental support.
   *
   * Default - `module`.
   */
  singleton?: 'module';
  guards: NormalizedGuard[];
}
