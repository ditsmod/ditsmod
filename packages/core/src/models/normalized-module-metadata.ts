import { InjectionToken } from '@ts-stack/di';

import { AnyObj, ControllerType, ModuleType, ModuleWithParams, ServiceProvider, Extension } from '../types/mix';
import { ProvidersMetadata } from './providers-metadata';

export class NormalizedModuleMetadata<T extends AnyObj = AnyObj, A extends AnyObj = AnyObj> extends ProvidersMetadata {
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
  extensions?: InjectionToken<Extension<any>[]>[] = [];
  ngMetadataName: string;
  exportsModules?: ModuleType[] = [];
  exportsWithParams?: ModuleWithParams[] = [];
  exportsProviders?: ServiceProvider[] = [];
  /**
   * This property allows you to pass any information to extensions.
   * 
   * You must follow this rule: data for one extension - one key in `additionalMeta` object.
   */
  extensionsMeta? = {} as A;
}
