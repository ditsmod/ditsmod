import { Type, Provider, makeDecorator } from 'ts-di';

import { ModuleWithProviders } from '../types/types';
import { AbstractModuleMetadata } from './root-module';

export interface ModuleDecoratorFactory {
  (data?: ModuleDecorator): any;
  new (data?: ModuleDecorator): ModuleDecorator;
}

export interface ModuleDecorator extends Partial<AbstractModuleMetadata> {
  /**
   * List of modules or `ModuleWithProviders` imported by this module.
   */
  imports?: Array<Type<any> | ModuleWithProviders<{}> | any[]>;
  /**
   * List of modules, `ModuleWithProviders` or providers exported by this
   * module.
   */
  exports?: Array<Type<any> | ModuleWithProviders<{}> | Provider | any[]>;
}

export const Module = makeDecorator('Module', (data: any) => data) as ModuleDecoratorFactory;
