import type { AnyObj } from '#types/mix.js';
import type { ModRefId, StaticModule } from '#decorators/module-decorator-options.js';
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
  importsModules: StaticModule[];
  /**
   * Import dynamic modules.
   */
  importsWithOpts: DynamicModule[];
  providersPerApp: Provider[];
  providersPerMod: Provider[];
  providersPerRou: Provider[];
  providersPerReq: Provider[];
  exportsModules: StaticModule[];
  /**
   * Export dynamic modules.
   */
  exportsWithOpts: DynamicModule[];
  exportedProvidersPerMod: Provider[];
  exportedProvidersPerRou: Provider[];
  exportedProvidersPerReq: Provider[];
  exportedMultiProvidersPerMod: MultiProvider[];
  exportedMultiProvidersPerRou: MultiProvider[];
  exportedMultiProvidersPerReq: MultiProvider[];
  resolvedCollisionsPerApp: [any, ModRefId][];
  resolvedCollisionsPerMod: [any, ModRefId][];
  resolvedCollisionsPerRou: [any, ModRefId][];
  resolvedCollisionsPerReq: [any, ModRefId][];
  extensionProviders: Provider[];
  exportedExtensionProviders: Provider[];
  extensionConfigs: ExtensionConfig[];
  exportedExtensionConfigs: ExtensionConfig[];
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
  moduleOptions: AnyObj;
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
   * Indicates whether this module inherits context/init hooks from parent modules.
   */
  inheritsContext?: boolean;
  /**
   * Contains init hooks and init options collected from init module decorators.
   */
  initHooksMap = new Map<AnyFn, InitHooks>();
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
  extensionGroupTokenMap = new Map<ExtensionClass, GroupToken>();
  /**
   * The mapping between an extension specified in {@link BaseExtensionConfig.groups | ExtensionConfig.groups}
   * and the extension group token assigned to it.
   */
  exportedExtensionGroupTokenMap = new Map<ExtensionClass, GroupToken>();

  constructor() {
    super();
    this.importsModules = [];
    this.importsWithOpts = [];
    this.providersPerApp = [];
    this.providersPerMod = [];
    this.providersPerRou = [];
    this.providersPerReq = [];
    this.exportsModules = [];
    this.exportsWithOpts = [];
    this.exportedProvidersPerMod = [];
    this.exportedProvidersPerRou = [];
    this.exportedProvidersPerReq = [];
    this.exportedMultiProvidersPerMod = [];
    this.exportedMultiProvidersPerRou = [];
    this.exportedMultiProvidersPerReq = [];
    this.resolvedCollisionsPerApp = [];
    this.resolvedCollisionsPerMod = [];
    this.resolvedCollisionsPerRou = [];
    this.resolvedCollisionsPerReq = [];
    this.extensionProviders = [];
    this.exportedExtensionProviders = [];
    this.extensionConfigs = [];
    this.exportedExtensionConfigs = [];
    this.extensionsMeta = {} as ExtensionMeta;
  }
}
