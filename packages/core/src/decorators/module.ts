import { makeDecorator } from '@ts-stack/di';

import { ModuleMetadata } from '../types/module-metadata';

export interface ModuleDecoratorFactory {
  (data?: ModuleMetadata): any;
  new (data?: ModuleMetadata): ModuleMetadata;
}

export const Module = makeDecorator('Module', (data: ModuleMetadata) => data) as ModuleDecoratorFactory;
