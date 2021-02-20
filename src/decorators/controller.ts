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
  controller: TypeProvider;
  method: string;
  route: RouteMetadata;
  providers: ResolvedReflectiveProvider[];
  injector: ReflectiveInjector;
  parseBody: boolean;
  guardItems: NormalizedGuard[];
}
