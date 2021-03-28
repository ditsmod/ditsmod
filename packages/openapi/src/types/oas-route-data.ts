import { ReflectiveInjector, ResolvedReflectiveProvider } from '@ts-stack/di';
import { edk } from '@ditsmod/core';

import { OasRouteMetadata } from '../decorators/oas-route';

export interface OasRouteData {
  controller: edk.ControllerType;
  /**
   * The controller's method name.
   */
  methodName: string;
  route: OasRouteMetadata;
  /**
   * Resolved providers per request.
   */
  providers: ResolvedReflectiveProvider[];
  /**
   * Injector per a module.
   */
  injector: ReflectiveInjector;
  /**
   * Need or not parse body.
   */
  parseBody: boolean;
  /**
   * An array of DI tokens used to look up `CanActivate()` handlers,
   * in order to determine if the current user is allowed to activate the controller.
   * By default, any user can activate.
   */
  guards: edk.NormalizedGuard[];
  decoratorMetadata: edk.DecoratorMetadata;
}
