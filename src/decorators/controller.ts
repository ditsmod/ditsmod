import { Provider, makeDecorator } from '@ts-stack/di';

export interface ControllerDecoratorFactory {
  (data?: ControllerMetadata): any;
  new (data?: ControllerMetadata): ControllerMetadata;
}

export interface ControllerMetadata {
  /**
   * Providers per HTTP request.
   */
  providersPerReq?: Provider[];
}

export const Controller = makeDecorator('Controller', (data: any) => data) as ControllerDecoratorFactory;
