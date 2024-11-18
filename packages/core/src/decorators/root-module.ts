import { makeClassDecorator } from '#di';
import { RootModuleMetadata } from '#types/root-module-metadata.js';
import { transformModule } from './module.js';

export const rootModule: RootModuleDecorator = makeClassDecorator(transformModule);

export interface RootModuleDecorator {
  (data?: RootModuleMetadata): any;
}
