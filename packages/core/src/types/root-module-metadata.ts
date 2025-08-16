import { ModRefId } from './mix.js';
import { ModuleMetadata } from './module-metadata.js';

export interface RootModuleMetadata extends ModuleMetadata {
  /**
   * An array of pairs, each of which is in the first place the provider's token,
   * and in the second - the module from which to import the provider with the specified token.
   */
  resolvedCollisionsPerApp?: [any, ModRefId][];
}
