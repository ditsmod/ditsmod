import type { AnyObj, ModRefId, ModuleType } from '#types/mix.js';
import type { AnyFn, Class } from '#di/top/types-and-models.js';
import type { Provider } from '#di/top/types-and-models.js';
import type { ModuleWithParams } from '../decorators/module-raw-metadata.js';
import type { ExtensionConfig} from '#extension/extension-providers-and-configs.js';
import type { ExtensionConfigBase } from '#extension/extension-providers-and-configs.js';
import type { InitMetaMap } from '#decorators/init-hooks-and-metadata.js';
import type { InitHooks } from '#decorators/init-hooks-and-metadata.js';
import type { AllInitHooks } from '#decorators/init-hooks-and-metadata.js';
import type { ExtensionClass } from '#extension/extension-types.js';
import type { GroupToken } from '#di/key-registry.js';
import type { MultiProvider } from '#di/utils.js';

export class BaseInitMeta<A extends AnyObj = AnyObj> {
  /**
   * The module ID.
   */
  id?: string = '';
  importsModules: ModuleType[];
  importsWithParams: ModuleWithParams[];
  providersPerApp: Provider[];
  providersPerMod: Provider[];
  providersPerRou: Provider[];
  providersPerReq: Provider[];
  exportsModules: ModuleType[];
  exportsWithParams: ModuleWithParams[];
  exportedProvidersPerMod: Provider[];
  exportedProvidersPerRou: Provider[];
  exportedProvidersPerReq: Provider[];
  exportedMultiProvidersPerMod: MultiProvider[];
  exportedMultiProvidersPerRou: MultiProvider[];
  exportedMultiProvidersPerReq: MultiProvider[];
  resolvedCollisionPerApp: [any, ModRefId][];
  resolvedCollisionPerMod: [any, ModRefId][];
  resolvedCollisionPerRou: [any, ModRefId][];
  resolvedCollisionPerReq: [any, ModRefId][];
  extensionProviders: Provider[];
  exportedExtensionProviders: Provider[];
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
 * instance to forward property value assignments from the `InitMeta` instance to the {@link BaseMeta} instance. Here,
 * `InitMeta` refers to the extended interface of normalized data that provides init hooks. This is done to simplify
 * synchronization between {@link BaseMeta} and the metadata from init decorators.
 */
export function getProxyForInitMeta<T extends BaseInitMeta>(baseMeta: BaseMeta, InitMetaClass: Class<T>): T {
  return new Proxy(new InitMetaClass(), {
    get(meta, prop: keyof BaseMeta, proxy) {
      if (Reflect.has(baseMeta, prop)) {
        return Reflect.get(baseMeta, prop, proxy);
      } else {
        return Reflect.get(meta, prop, proxy);
      }
    },
    set(meta, prop: keyof BaseMeta, value, proxy) {
      if (Reflect.has(baseMeta, prop) && Reflect.has(meta, prop)) {
        // @todo Create special error
        const msg = `${prop} is reserved for internal use by BaseMeta. You cannot use ${InitMetaClass.name}.${prop}.`;
        throw new TypeError(msg);
      } else if (Reflect.has(baseMeta, prop)) {
        return Reflect.set(baseMeta, prop, value, proxy);
      } else {
        return Reflect.set(meta, prop, value, proxy);
      }
    },
  });
}

/**
 * Normalized metadata taken from the `rootModule` or `featureModule` decorator.
 */
export class BaseMeta<
  TypeOfModule extends AnyObj = AnyObj,
  ExtensionMeta extends AnyObj = AnyObj,
> extends BaseInitMeta<ExtensionMeta> {
  /**
   * Metadata returned by the decorator transformer for the module.
   */
  rawMeta: AnyObj;
  /**
   * The module setted here must be identical to the module
   * passed to "imports", "exports" array of `@featureModule` metadata.
   */
  modRefId: ModRefId<TypeOfModule>;
  /**
   * The module name.
   */
  name: string;
  /**
   * The directory in which the class was declared.
   */
  declaredInDir: string;
  /**
   * Indicates whether this module is external to the application.
   */
  isExternal?: boolean;
  /**
   * Contains init hooks and raw metadata collected from init module decorators.
   */
  mInitHooks = new Map<AnyFn, InitHooks>();
  /**
   * Contains normalized metadata collected from module init decorators.
   */
  initMeta: InitMetaMap = new Map();
  /**
   * List of unique init hooks found in the current module and all imported modules.
   */
  allInitHooks: AllInitHooks = new Map();
  /**
   * The mapping between an extension specified in {@link ExtensionConfigBase.groups | ExtensionConfig.groups}
   * and the extension group token assigned to it.
   */
  mExtensionAsGroupToken = new Map<ExtensionClass, GroupToken>();
  /**
   * The mapping between an extension specified in {@link ExtensionConfigBase.groups | ExtensionConfig.groups}
   * and the extension group token assigned to it.
   */
  mExportedExtensionAsGroupToken = new Map<ExtensionClass, GroupToken>();

  constructor() {
    super();
    this.importsModules = [];
    this.importsWithParams = [];
    this.providersPerApp = [];
    this.providersPerMod = [];
    this.providersPerRou = [];
    this.providersPerReq = [];
    this.exportsModules = [];
    this.exportsWithParams = [];
    this.exportedProvidersPerMod = [];
    this.exportedProvidersPerRou = [];
    this.exportedProvidersPerReq = [];
    this.exportedMultiProvidersPerMod = [];
    this.exportedMultiProvidersPerRou = [];
    this.exportedMultiProvidersPerReq = [];
    this.resolvedCollisionPerApp = [];
    this.resolvedCollisionPerMod = [];
    this.resolvedCollisionPerRou = [];
    this.resolvedCollisionPerReq = [];
    this.extensionProviders = [];
    this.exportedExtensionProviders = [];
    this.aExtensionConfig = [];
    this.aExportedExtensionConfig = [];
    this.extensionsMeta = {} as ExtensionMeta;
  }
}
