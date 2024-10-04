import { ModuleType } from './mix.js';
import { ModuleWithParams } from './module-metadata.js';

export interface RootModuleMetadata {
  /**
   * An array of pairs, each of which is in the first place the provider's token,
   * and in the second - the module from which to import the provider with the specified token.
   */
  resolvedCollisionsPerApp?: [any, ModuleType | ModuleWithParams][];
}
