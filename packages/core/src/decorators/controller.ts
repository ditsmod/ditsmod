import { makeDecorator } from '@ts-stack/di';

import { ServiceProvider } from '../types/mix';

export interface ControllerDecoratorFactory {
  (data?: ControllerMetadata): any;
  new (data?: ControllerMetadata): ControllerMetadata;
}

export interface ControllerMetadata {
  /**
   * Providers per HTTP request.
   */
  providersPerReq?: ServiceProvider[];
}

export const Controller = makeDecorator('Controller', (data: any) => data) as ControllerDecoratorFactory;
