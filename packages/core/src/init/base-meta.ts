import type { AnyObj, ModRefId, ModuleType } from '#types/mix.js';
import type { AnyFn, Class, Provider } from '#di/top/types-and-models.js';
import type { DynamicModule } from '../decorators/module-decorator-options.js';
import type { ExtensionConfig, BaseExtensionConfig } from '#extension/extension-providers-and-configs.js';
import type { InitMetaMap, InitHooks, AllInitHooks } from '#decorators/init-hooks-and-metadata.js';
import type { ExtensionClass } from '#extension/extension-types.js';
import type { GroupToken } from '#di/key-registry.js';
import type { MultiProvider } from '#di/utils.js';

export class NormalizedInitMeta<A extends AnyObj = AnyObj> {
  /**
   * The module ID.
   */
  id?: string = '';
  importsModules: ModuleType[];
  importsWithParams: DynamicModule[];
  providersPerApp: Provider[];
  providersPerMod: Provider[];
  providersPerRou: Provider[];
  providersPerReq: Provider[];
  exportsModules: ModuleType[];
  exportsWithParams: DynamicModule[];
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
 * instance to forward property value assignments from the `InitMeta` instance to the {@link NormalizedModuleMeta} instance. Here,
 * `InitMeta` refers to the extended interface of normalized data that provides init hooks. This is done to simplify
 * synchronization between {@link NormalizedModuleMeta} and the metadata from init decorators.
 */
export function getProxyForInitMeta<T extends NormalizedInitMeta>(
  normalizedModuleMeta: NormalizedModuleMeta,
  InitMetaClass: Class<T>,
): T {
  return new Proxy(new InitMetaClass(), {
    get(meta, prop: keyof NormalizedModuleMeta, proxy) {
      if (Reflect.has(normalizedModuleMeta, prop)) {
        return Reflect.get(normalizedModuleMeta, prop, proxy);
      } else {
        return Reflect.get(meta, prop, proxy);
      }
    },
    set(meta, prop: keyof NormalizedModuleMeta, value, proxy) {
      if (Reflect.has(normalizedModuleMeta, prop) && Reflect.has(meta, prop)) {
        // @todo Create special error
        const msg = `${prop} is reserved for internal use by NormalizedModuleMeta. You cannot use ${InitMetaClass.name}.${prop}.`;
        throw new TypeError(msg);
      } else if (Reflect.has(normalizedModuleMeta, prop)) {
        return Reflect.set(normalizedModuleMeta, prop, value, proxy);
      } else {
        return Reflect.set(meta, prop, value, proxy);
      }
    },
  });
}

/**
 * Normalized metadata taken from the `rootModule` or `featureModule` decorator.
 */
export class NormalizedModuleMeta<
  TypeOfModule extends AnyObj = AnyObj,
  ExtensionMeta extends AnyObj = AnyObj,
> extends NormalizedInitMeta<ExtensionMeta> {
  /**
   * Metadata returned by the decorator transformer for the module.
   */
  decoratorOptions: AnyObj;
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
   * The mapping between an extension specified in {@link BaseExtensionConfig.groups | ExtensionConfig.groups}
   * and the extension group token assigned to it.
   */
  mExtensionAsGroupToken = new Map<ExtensionClass, GroupToken>();
  /**
   * The mapping between an extension specified in {@link BaseExtensionConfig.groups | ExtensionConfig.groups}
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
