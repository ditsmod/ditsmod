import { ReflectiveInjector, ResolvedReflectiveProvider } from '@ts-stack/di';
import { edk, HttpMethod } from '@ditsmod/core';
import { ReferenceObject, XParameterObject } from '@ts-stack/openapi-spec';

export interface OasRouteData {
  path: string;
  parameters: (ReferenceObject | XParameterObject<any>)[];
  controller: edk.ControllerType;
  /**
   * The controller's method name.
   */
  methodName: string;
  httpMethod: HttpMethod;
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
