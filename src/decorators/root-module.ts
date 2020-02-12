import { makeDecorator } from 'ts-di';

import { ApplicationMetadata } from '../types/default-options';
import { ModuleDecorator } from './module';

export interface RootModuleDecoratorFactory {
  (data?: RootModuleDecorator): any;
  new (data?: RootModuleDecorator): RootModuleDecorator;
}

export interface RootModuleDecorator extends ModuleDecorator, Partial<ApplicationMetadata> {
  exports?: never;
}

export const RootModule = makeDecorator('RootModule', (data: any) => data) as RootModuleDecoratorFactory;
