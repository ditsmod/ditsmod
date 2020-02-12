import { Provider, makeDecorator } from 'ts-di';

export interface ControllersDecoratorFactory {
  (data?: ControllerDecorator): any;
  new (data?: ControllerDecorator): ControllerDecorator;
}

export interface ControllerDecorator {
  /**
   * Providers per HTTP request.
   */
  providersPerReq?: Provider[];
}

export const Controller = makeDecorator('Controller', (data: any) => data) as ControllersDecoratorFactory;
