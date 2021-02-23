import { Provider, makeDecorator, TypeProvider, ReflectiveInjector, ResolvedReflectiveProvider } from '@ts-stack/di';
import { NormalizedGuard } from '../types/router';
import { RouteMetadata } from './route';

export interface ControllerDecoratorFactory {
  (data?: ControllerDecorator): any;
  new (data?: ControllerDecorator): ControllerDecorator;
}

export interface ControllerDecorator {
  /**
   * Providers per HTTP request.
   */
  providersPerReq?: Provider[];
}

export const Controller = makeDecorator('Controller', (data: any) => data) as ControllerDecoratorFactory;

/**
 * All properties of this class are initialized with `null`.
 */
export class RouteData {
  controller: TypeProvider = null;
  /**
   * The controller's method name.
   */
  methodName: string = null;
  route: RouteMetadata = null;
  /**
   * Resolved providers per request.
   */
  providers: ResolvedReflectiveProvider[] = null;
  /**
   * Injector per a module.
   */
  injector: ReflectiveInjector = null;
  /**
   * Need or not parse body.
   */
  parseBody: boolean = null;
  /**
   * An array of DI tokens used to look up `CanActivate()` handlers,
   * in order to determine if the current user is allowed to activate the controller.
   * By default, any user can activate.
   */
  guards: NormalizedGuard[] = null;
}

/**
 * All properties of this class are initialized with `null`.
 */
export class PreRouteData extends RouteData {
  /**
   * During application initialization, this ID increments with each controller method.
   */
  methodId: number = null;
  /**
   * This ID is unique per the application. During application initialization, it increments
   * with each decorator assigned to the controller method.
   */
  decoratorId: number = null;
}

// eslint-disable-next-line @typescript-eslint/ban-types
export interface MethodDecoratorObject<MethodDecorValue extends object = any> {
  /**
   * During application initialization, this ID increments with each controller method.
   */
  methodId: number;
  /**
   * This ID is unique per the application. During application initialization, it increments
   * with each decorator assigned to the controller method.
   */
  decoratorId: number;
  /**
   * Decorator value.
   */
  value: MethodDecorValue;
}

// eslint-disable-next-line @typescript-eslint/ban-types
export interface ControllerMetadata<ControllerDecorValue extends object = any, MethodDecorValue extends object = any> {
  controller: TypeProvider;
  /**
   * Controller decorators values.
   */
  ctrlDecorValues: ControllerDecorValue[];
  methods: {
    [methodName: string]: MethodDecoratorObject<MethodDecorValue>[];
  };
}
