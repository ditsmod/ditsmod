import { ModuleType } from './mix.js';
import { ModuleMetadata, BaseModuleWithParams } from './module-metadata.js';

export interface RootModuleMetadata extends ModuleMetadata {
  id?: never;
  /**
   * An array of pairs, each of which is in the first place the provider's token,
   * and in the second - the module from which to import the provider with the specified token.
   */
  resolvedCollisionsPerApp?: [any, ModuleType | BaseModuleWithParams][];
}
