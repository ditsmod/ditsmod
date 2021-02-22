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

export interface RouteData {
  /**
   * This ID is unique per the application. During application initialization, it increments
   * with each decorator assigned to the controller method.
   */
  id: number;
  controller: TypeProvider;
  /**
   * The controller's method name.
   */
  methodName: string;
  route: RouteMetadata;
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
  guards: NormalizedGuard[];
}

// eslint-disable-next-line @typescript-eslint/ban-types
export interface MethodDecoratorObject<MethodDecorValue extends object = any> {
  /**
   * This ID is unique per the application. During application initialization, it increments
   * with each decorator assigned to the controller method.
   */
  id: number;
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
