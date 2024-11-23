import { Class } from '#di';
import { AnyFn, AnyObj, ModuleType, NormalizedGuard, Provider } from '#types/mix.js';
import { AppendsWithParams, ModuleWithParams } from './module-metadata.js';
import { ExtensionProvider } from '#extension/extension-types.js';
import { MultiProvider } from '#utils/type-guards.js';
import { ProvidersMetadata } from '#types/providers-metadata.js';
import { ExtendedModuleMetadata } from '#decorators/module.js';

export class NormalizedModuleMetadata<T extends AnyObj = AnyObj, A extends AnyObj = AnyObj> extends ProvidersMetadata {
  override providersPerApp: Provider[] = [];
  override providersPerMod: Provider[] = [];
  override providersPerRou: Provider[] = [];
  override providersPerReq: Provider[] = [];
  rawMeta: ExtendedModuleMetadata;
  /**
   * The module setted here must be identical to the module
   * passed to "imports", "exports" or "appends" array of `@featureModule` metadata.
   */
  modRefId: ModuleType<T> | ModuleWithParams<T> | AppendsWithParams<T>;
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
  appendsModules: ModuleType[] = [];
  appendsWithParams: AppendsWithParams[] = [];
  controllers: Class[] = [];
  decorator: AnyFn;
  /**
   * The directory in which the class was declared.
   */
  declaredInDir: string;
  /**
   * Indicates whether this module is external to the application.
   */
  isExternal: boolean;
  exportsModules: ModuleType[] = [];
  exportsWithParams: ModuleWithParams[] = [];
  exportedProvidersPerMod: Provider[] = [];
  exportedProvidersPerRou: Provider[] = [];
  exportedProvidersPerReq: Provider[] = [];
  exportedMultiProvidersPerMod: MultiProvider[] = [];
  exportedMultiProvidersPerRou: MultiProvider[] = [];
  exportedMultiProvidersPerReq: MultiProvider[] = [];
  guardsPerMod: NormalizedGuard[] = [];
  resolvedCollisionsPerApp: [any, ModuleType | ModuleWithParams][] = [];
  resolvedCollisionsPerMod: [any, ModuleType | ModuleWithParams][] = [];
  resolvedCollisionsPerRou: [any, ModuleType | ModuleWithParams][] = [];
  resolvedCollisionsPerReq: [any, ModuleType | ModuleWithParams][] = [];
  extensionsProviders: ExtensionProvider[] = [];
  exportedExtensions: ExtensionProvider[] = [];
  /**
   * This property allows you to pass any information to extensions.
   *
   * You must follow this rule: data for one extension - one key in `extensionsMeta` object.
   */
  extensionsMeta = {} as A;
}
