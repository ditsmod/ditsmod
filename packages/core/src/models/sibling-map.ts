import { ModuleType, ModuleWithParams } from '../types/mix';

/**
 * Instances of this class will hold a mapping between the providers for injectors on a particular
 * scope and the tokens with which they will be associated. This mapping is required to
 * provide encapsulation when importing external modules to a current module.
 */
export class SiblingMap {
  module: ModuleType | ModuleWithParams;
  /**
   * An array of tokens that will be associated with the injector on a certain scope.
   */
  tokens: Set<any>;
}
