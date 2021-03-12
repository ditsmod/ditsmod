import { AnyObj } from '../types/any-obj';
import { ControllerType } from '../types/controller-type';
import { ExtensionType } from '../types/extension-type';
import { ModuleType } from '../types/module-type';
import { ModuleWithParams } from '../types/module-with-params';
import { ServiceProvider } from '../types/service-provider';
import { ProvidersMetadata } from './providers-metadata';

export class NormalizedModuleMetadata<T extends AnyObj = AnyObj> extends ProvidersMetadata {
  /**
   * The module setted here must be identical to the module
   * passed to "imports" or "exports" array of `@Module` metadata.
   */
  module: ModuleType<T> | ModuleWithParams<T>;
  /**
   * The module name.
   */
  name: string;
  /**
   * The module ID.
   */
  id?: string = '';
  importsModules?: ModuleType[] = [];
  importsWithParams?: ModuleWithParams[] = [];
  controllers?: ControllerType[] = [];
  extensions?: ExtensionType[] = [];
  ngMetadataName: string;
  exportsModules?: ModuleType[] = [];
  exportsProviders?: ServiceProvider[] = [];
}
