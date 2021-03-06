import { makeDecorator } from '@ts-stack/di';

import { ModuleMetadata } from '../types/module-metadata';
import { RootModuleMetadata } from '../types/root-module-metadata';

export interface RootModuleDecoratorFactory {
  (data?: RootModuleDecorator): any;
  new (data?: RootModuleDecorator): RootModuleDecorator;
}
export interface RootModuleDecorator extends Omit<ModuleMetadata, 'id'>, RootModuleMetadata {}
export const RootModule = makeDecorator('RootModule', (data: any) => data) as RootModuleDecoratorFactory;
