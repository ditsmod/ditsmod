import { MultiProvider } from '#di';
import { AnyFn, AnyObj, ModuleType } from '#types/mix.js';
import { Provider } from '#di/types-and-models.js';
import { BaseModuleWithParams } from './module-metadata.js';
import { RawMeta } from '#decorators/feature-module.js';
import { ExtensionConfig } from '#extension/get-extension-provider.js';
import { ExtensionClass } from '#extension/extension-types.js';

export class NormalizedMeta<T extends AnyObj = AnyObj, A extends AnyObj = AnyObj> {
  providersPerApp: Provider[] = [];
  providersPerMod: Provider[] = [];
  rawMeta: RawMeta;
  /**
   * The module setted here must be identical to the module
   * passed to "imports", "exports" array of `@featureModule` metadata.
   */
  modRefId: ModuleType<T> | BaseModuleWithParams<T>;
  /**
   * The module name.
   */
  name: string;
  /**
   * The module ID.
   */
  id?: string = '';
  importsModules: ModuleType[] = [];
  importsWithParams: BaseModuleWithParams[] = [];
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
  exportsWithParams: BaseModuleWithParams[] = [];
  exportedProvidersPerMod: Provider[] = [];
  exportedMultiProvidersPerMod: MultiProvider[] = [];
  resolvedCollisionsPerApp: [any, ModuleType | BaseModuleWithParams][] = [];
  resolvedCollisionsPerMod: [any, ModuleType | BaseModuleWithParams][] = [];
  extensionsProviders: Provider[] = [];
  exportedExtensionsProviders: Provider[] = [];
  aExtensionConfig: ExtensionConfig[] = [];
  aOrderedExtensions: ExtensionClass[] = [];
  aExportedExtensionConfig: ExtensionConfig[] = [];
  /**
   * This property allows you to pass any information to extensions.
   *
   * You must follow this rule: data for one extension - one key in `extensionsMeta` object.
   */
  extensionsMeta = {} as A;
}
