import { Class, MultiProvider } from '#di';
import { AnyFn, AnyObj, ModRefId, ModuleType } from '#types/mix.js';
import { Provider } from '#di/types-and-models.js';
import { ModuleWithParams } from './module-metadata.js';
import { ExtensionConfig } from '#extension/get-extension-provider.js';
import { InitMetaMap } from '#decorators/init-hooks-and-metadata.js';
import { InitHooksAndRawMeta } from '#decorators/init-hooks-and-metadata.js';
import { AllInitHooks } from '#decorators/init-hooks-and-metadata.js';

export class BaseInitMeta<A extends AnyObj = AnyObj> {
  importsModules: ModuleType[];
  importsWithParams: ModuleWithParams[];
  providersPerApp: Provider[];
  providersPerMod: Provider[];
  exportsModules: ModuleType[];
  exportsWithParams: ModuleWithParams[];
  exportedProvidersPerMod: Provider[];
  exportedMultiProvidersPerMod: MultiProvider[];
  resolvedCollisionsPerApp: [any, ModRefId][];
  resolvedCollisionsPerMod: [any, ModRefId][];
  extensionsProviders: Provider[];
  exportedExtensionsProviders: Provider[];
  aExtensionConfig: ExtensionConfig[];
  aExportedExtensionConfig: ExtensionConfig[];
  /**
   * This property allows you to pass any information to extensions.
   *
   * You must follow this rule: data for one extension - one key in `extensionsMeta` object.
   */
  extensionsMeta: A;
}

/**
 * Creates a {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy | Proxy}
 * instance to redirect requests to properties inherited from {@link BaseInitMeta} to the {@link baseMeta} instance.
 * This is done to simplify synchronization between {@link BaseMeta} and the metadata from init decorators.
 */
export function getProxyForInitMeta<T extends BaseInitMeta>(baseMeta: BaseInitMeta, BaseInitCls: Class<T>): T {
  return new Proxy(new BaseInitCls(), {
    get(target, prop: keyof BaseInitMeta) {
      if (prop in baseMeta) {
        return baseMeta[prop];
      } else {
        return target[prop];
      }
    },
    set(target, prop: keyof BaseInitMeta, value) {
      if (prop in baseMeta) {
        baseMeta[prop] = value;
      } else {
        target[prop] = value;
      }
      return true;
    },
  });
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

  constructor() {
    super();
    this.importsModules = [];
    this.importsWithParams = [];
    this.providersPerApp = [];
    this.providersPerMod = [];
    this.exportsModules = [];
    this.exportsWithParams = [];
    this.exportedProvidersPerMod = [];
    this.exportedMultiProvidersPerMod = [];
    this.resolvedCollisionsPerApp = [];
    this.resolvedCollisionsPerMod = [];
    this.extensionsProviders = [];
    this.exportedExtensionsProviders = [];
    this.aExtensionConfig = [];
    this.aExportedExtensionConfig = [];
    this.extensionsMeta = {} as A;
  }
}
