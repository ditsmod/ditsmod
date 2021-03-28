import { ReflectiveInjector, ResolvedReflectiveProvider } from '@ts-stack/di';
import { edk, HttpMethod } from '@ditsmod/core';

export interface OasRouteData {
  path: string;
  controller: edk.ControllerType;
  /**
   * The controller's method name.
   */
  methodName: string;
  httpMethods: HttpMethod[];
  /**
   * Resolved providers per request.
   */
  providers: ResolvedReflectiveProvider[];
  /**
   * Injector per a module.
   */
  injector: ReflectiveInjector;
  /**
   * An array of DI tokens used to look up `CanActivate()` handlers,
   * in order to determine if the current user is allowed to activate the controller.
   * By default, any user can activate.
   */
  guards: edk.NormalizedGuard[];
  decoratorMetadata: edk.DecoratorMetadata;
}
