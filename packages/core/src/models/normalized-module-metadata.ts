import { AnyObj, ControllerType, ModuleType, ModuleWithParams, ServiceProvider, ExtensionsProvider } from '../types/mix';
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
  importsModules: ModuleType[] = [];
  importsWithParams: ModuleWithParams[] = [];
  controllers: ControllerType[] = [];
  ngMetadataName: string;
  exportsModules: ModuleType[] = [];
  exportsWithParams: ModuleWithParams[] = [];
  exportsProvidersPerMod: ServiceProvider[] = [];
  exportsProvidersPerRou: ServiceProvider[] = [];
  exportsProvidersPerReq: ServiceProvider[] = [];
  resolvedCollisionsPerApp: [any, ModuleType | ModuleWithParams][] = [];
  resolvedCollisionsPerMod: [any, ModuleType | ModuleWithParams][] = [];
  resolvedCollisionsPerRou: [any, ModuleType | ModuleWithParams][] = [];
  resolvedCollisionsPerReq: [any, ModuleType | ModuleWithParams][] = [];
  extensions: ExtensionsProvider[] = [];
  /**
   * Here must be tokens only (not objects with `provide` property).
   */
  exportsExtensions: ExtensionsProvider[] = [];
  /**
   * This property allows you to pass any information to extensions.
   *
   * You must follow this rule: data for one extension - one key in `extensionsMeta` object.
   */
  extensionsMeta = {} as A;
}
