import { Provider, makeDecorator, TypeProvider, ReflectiveInjector, ResolvedReflectiveProvider } from '@ts-stack/di';
import { GuardItems, HttpMethod } from '../types/router';

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
  httpMethod: HttpMethod;
  routePath: string;
  controller: TypeProvider;
  injector: ReflectiveInjector;
  providers: ResolvedReflectiveProvider[];
  method: string;
  parseBody: boolean;
  guardItems: GuardItems[];
}
