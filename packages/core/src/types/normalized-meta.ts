import { DecoratorAndValue, MultiProvider } from '#di';
import { AnyFn, AnyObj, ModuleType } from '#types/mix.js';
import { Provider } from '#di/types-and-models.js';
import { ModuleWithParams } from './module-metadata.js';
import { ExtensionConfig } from '#extension/get-extension-provider.js';
import { ExtensionClass } from '#extension/extension-types.js';
import { AttachedMetadata } from '#decorators/feature-module.js';

export interface MetaAndImportsOrExports<T extends AnyObj = AnyObj> {
  /**
   * Normalized metadata.
   */
  meta?: T;
  /**
   * Properties in `meta` that imported or exported modules have (e.g. `importsModules` or `exportsModules`).
   */
  importsOrExports?: (ModuleWithParams | ModuleType)[];
}

export class NormalizedMeta<T extends AnyObj = AnyObj, A extends AnyObj = AnyObj> {
  /**
   * The module setted here must be identical to the module
   * passed to "imports", "exports" array of `@featureModule` metadata.
   */
  modRefId: ModuleType<T> | ModuleWithParams<T>;
  /**
   * The module name.
   */
  name: string;
  /**
   * The module ID.
   */
  id?: string = '';
  decorator: AnyFn;
  /**
   * The directory in which the class was declared.
   */
  declaredInDir: string;
  /**
   * Indicates whether this module is external to the application.
   */
  isExternal: boolean;
  aDecoratorMeta: DecoratorAndValue<AttachedMetadata>[] = [];
  mMeta = new Map<AnyFn, MetaAndImportsOrExports | undefined>();
  mBootstrap = new Map<AnyFn, AnyObj | undefined>();

  importsModules: ModuleType[] = [];
  importsWithParams: ModuleWithParams[] = [];
  providersPerApp: Provider[] = [];
  providersPerMod: Provider[] = [];
  exportsModules: ModuleType[] = [];
  exportsWithParams: ModuleWithParams[] = [];
  exportedProvidersPerMod: Provider[] = [];
  exportedMultiProvidersPerMod: MultiProvider[] = [];
  resolvedCollisionsPerApp: [any, ModuleType | ModuleWithParams][] = [];
  resolvedCollisionsPerMod: [any, ModuleType | ModuleWithParams][] = [];
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
