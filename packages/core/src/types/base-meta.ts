import { MultiProvider } from '#di';
import { AnyFn, AnyObj, ModRefId, ModuleType } from '#types/mix.js';
import { Provider } from '#di/types-and-models.js';
import { ModuleWithParams } from './module-metadata.js';
import { ExtensionConfig } from '#extension/get-extension-provider.js';
import { ExtensionClass } from '#extension/extension-types.js';
import { InitMetaMap } from '#decorators/init-hooks-and-metadata.js';
import { InitHooksAndRawMeta } from '#decorators/init-hooks-and-metadata.js';
import { AllInitHooks } from '#decorators/init-hooks-and-metadata.js';

export class BaseInitMeta<A extends AnyObj = AnyObj> {
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

/**
 * Normalized metadata taken from the `rootModule` or `featureModule` decorator.
 */
export class BaseMeta<T extends AnyObj = AnyObj, A extends AnyObj = AnyObj> extends BaseInitMeta<A> {
  /**
   * The module setted here must be identical to the module
   * passed to "imports", "exports" array of `@featureModule` metadata.
   */
  modRefId: ModRefId<T>;
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
  /**
   * Contains init hooks and raw metadata collected from init module decorators.
   */
  mInitHooksAndRawMeta = new Map<AnyFn, InitHooksAndRawMeta>();
  /**
   * Contains normalized metadata collected from module init decorators.
   */
  initMeta: InitMetaMap = new Map();
  /**
   * List of unique init hooks found in the current module and all imported modules.
   */
  allInitHooks: AllInitHooks = new Map();
}
