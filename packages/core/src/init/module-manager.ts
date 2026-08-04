import type { SystemLogMediator } from '#logger/system-log-mediator.js';
import type { AnyObj } from '#types/mix.js';
import type { StaticModule, ModRefId } from '#decorators/module-decorator-options.js';
import type { DynamicModule } from '#decorators/module-decorator-options.js';
import type { BaseNormalizedModuleMeta, NormalizedModuleMeta } from '#init/normalized-meta.js';
import type { AllModuleMixins, ModuleMixin } from '#decorators/module-mixins.js';
import type { Provider, AnyFn } from '#di/top/types-and-models.js';
import type { Injector } from '#di/injector.js';
import { resolveForwardRef, type ForwardRefFn } from '#di/forward-ref.js';
import { isRootModule } from '#decorators/type-guards.js';
import { clearDebugClassNames, getDebugClassName } from '#utils/get-debug-class-name.js';
import { ModuleNormalizer } from '#init/module-normalizer.js';
import { ModuleIdNotFound, NormalizationFailure, MissingRootDecorator } from '#errors';
import { getModule } from '#utils/get-module.js';

export type ModulesMap = Map<ModRefId, NormalizedModuleMeta>;
export type ModulesMapId = Map<string, ModRefId>;
export type ModuleId = string | ModRefId;

/**
 * Recursively scans metadata attached to module classes via decorators, normalizes it, and validates it.
 * As a result of this process, a mapping is created between the module reference (`ModRefId`) and its normalized metadata.
 * Essentially, `ModRefId` is the form in which a module is passed in the `imports` array — that is,
 * either the static module class itself (`StaticModule`) or a dynamic module configuration object (`DynamicModule`).
 *
 * `ModuleManager` also stores module-level DI injectors, manages application-scoped providers, and propagates module mixins.
 */
export class ModuleManager {
  protected injectorPerModMap = new Map<ModRefId, Injector>();
  protected map: ModulesMap = new Map();
  protected mapId = new Map<'root' | (string & {}), ModRefId>();
  protected unfinishedScanModules = new Set<ModRefId>();
  protected scannedModules = new Set<ModRefId>();
  protected propsWithModules = [
    'importedStaticModules',
    'importedDynamicModules',
    'exportedStaticModules',
    'exportedDynamicModules',
  ] satisfies (keyof BaseNormalizedModuleMeta)[];
  #childrenMap = new Map<ModRefId, Set<ModRefId>>();
  #providersPerApp: Provider[] = [];
  /**
   * Represents the module dependency graph.
   *
   * It maps `ModRefId` to a `Set` of `ModRefId` of its child modules
   * (modules that it imports, exports, or includes via specialized module mixins).
   * This graph is built during the module scanning phase and is subsequently used
   * for recursive traversal, such as propagating parent module mixins to child modules.
   */
  protected get childrenMap() {
    return this.#childrenMap;
  }
  protected set childrenMap(val: Map<ModRefId, Set<ModRefId>>) {
    this.#childrenMap = val;
  }

  get providersPerApp(): Provider[] {
    return this.#providersPerApp;
  }
  protected set providersPerApp(val: Provider[]) {
    this.#providersPerApp = val;
  }

  /**
   * Returns the active mapping between module reference IDs (`ModRefId`) and their {@link NormalizedModuleMeta}.
   */
  get modulesMap(): ReadonlyMap<ModRefId, NormalizedModuleMeta> {
    return this.map;
  }

  /**
   * Returns the internal registry mapping module reference IDs (`ModRefId`) to their instantiated module-level injectors.
   */
  get injectorsPerMod(): ReadonlyMap<ModRefId, Injector> {
    return this.injectorPerModMap;
  }

  constructor(
    protected systemLogMediator: SystemLogMediator,
    protected moduleNormalizer: ModuleNormalizer = new ModuleNormalizer(),
  ) {}

  /**
   * Resets internal scan state and initiates recursive metadata resolution for all imported feature modules in the dependency graph.
   */
  scanRootModule(appModule: StaticModule): NormalizedModuleMeta {
    if (!isRootModule(appModule)) {
      throw new MissingRootDecorator(appModule.name);
    }
    this.providersPerApp = [];
    this.childrenMap.clear();
    const normalizedModuleMeta = this.scanModule(appModule);
    this.injectorPerModMap.clear();
    this.unfinishedScanModules.clear();
    this.scannedModules.clear();
    clearDebugClassNames();
    this.mapId.set('root', appModule);
    return normalizedModuleMeta;
  }

  /**
   * Recursively normalizes and registers metadata for a specified static or dynamic module reference.
   *
   * Traverses module dependencies (`imports`, `exports`, and modules discovered via specialized module mixins such as `appends`
   * or `controllers`), builds the module dependency graph (`this.childrenMap`), accumulates global providers into `providersPerApp`,
   * and processes module mixins across the hierarchy.
   */
  protected scanModule(modRefId: ModRefId | ForwardRefFn<ModRefId>, allModuleMixinsMap?: AllModuleMixins) {
    allModuleMixinsMap ??= new Map();
    modRefId = resolveForwardRef(modRefId);
    const normalizedModuleMeta = this.normalizeMeta(modRefId, allModuleMixinsMap);

    const children = new Set<ModRefId>();
    this.childrenMap.set(normalizedModuleMeta.modRefId, children);

    for (const child of this.getModulesToScan(normalizedModuleMeta)) {
      children.add(child);
      if (this.unfinishedScanModules.has(child) || this.scannedModules.has(child)) {
        continue;
      }
      this.unfinishedScanModules.add(child);
      this.scanModule(child, normalizedModuleMeta.allModuleMixinsMap);
      this.unfinishedScanModules.delete(child);
      this.scannedModules.add(child);
    }

    this.callModuleMixinAfterScan(normalizedModuleMeta);
    this.registerModuleId(normalizedModuleMeta, modRefId);
    this.accumulateProvidersPerApp(normalizedModuleMeta);

    this.setMeta(modRefId, normalizedModuleMeta);
    normalizedModuleMeta.allModuleMixinsMap.forEach((moduleMixin, decoratorId) => allModuleMixinsMap.set(decoratorId, moduleMixin));

    if (this.unfinishedScanModules.size == 0) {
      this.finalizeRootScan(modRefId);
    }

    return normalizedModuleMeta;
  }

  protected getModulesToScan(normalizedModuleMeta: NormalizedModuleMeta): ModRefId[] {
    const importsOrExports: ModRefId[] = [];
    normalizedModuleMeta.moduleMixinMap.forEach((moduleMixin, decoratorId) => {
      const meta = normalizedModuleMeta.normalizedMixinMetaMap.get(decoratorId);
      if (meta) {
        importsOrExports.push(...moduleMixin.getModulesToScan(meta));
      }
    });

    this.propsWithModules.forEach((p) => importsOrExports.push(...normalizedModuleMeta[p]));
    return importsOrExports;
  }

  /**
   * The current module may sometimes lack explicit mixin decorators that are present in imported modules
   * (for example, importing an architectural feature module without decorating the importer).
   * In such cases, after scanning all imported modules, the collected module mixins from them are also
   * executed for the current module. The result of executing these module mixins is objects with initialized
   * properties, into which relevant metadata (such as controllers or appended routes) can later be imported.
   */
  protected callModuleMixinAfterScan(normalizedModuleMeta: NormalizedModuleMeta) {
    normalizedModuleMeta.allModuleMixinsMap.forEach((moduleMixin, decoratorId) => {
      if (!normalizedModuleMeta.moduleMixinMap.has(decoratorId)) {
        const meta = moduleMixin.clone().normalize(normalizedModuleMeta);
        if (meta) {
          normalizedModuleMeta.normalizedMixinMetaMap.set(decoratorId, meta);
        }
      }
    });
  }

  protected registerModuleId(normalizedModuleMeta: NormalizedModuleMeta, modRefId: ModRefId) {
    if (normalizedModuleMeta.id) {
      this.mapId.set(normalizedModuleMeta.id, modRefId);
      this.systemLogMediator.moduleHasId(this, normalizedModuleMeta.id);
    }
  }

  protected accumulateProvidersPerApp(normalizedModuleMeta: NormalizedModuleMeta) {
    const providersPerApp = isRootModule(normalizedModuleMeta) ? [] : normalizedModuleMeta.providersPerApp;
    this.providersPerApp.push(...providersPerApp);
  }

  protected finalizeRootScan(modRefId: ModRefId) {
    this.applyHostMixinOptions();
    const rootModule = this.mapId.get('root') || resolveForwardRef(modRefId);
    this.propagateContextMixins(rootModule);
    this.checkEmptyMetaForAllModules();
  }

  protected setMeta(modRefId: ModRefId, normalizedModuleMeta: NormalizedModuleMeta) {
    this.map.set(modRefId, normalizedModuleMeta);
  }

  /**
   * Returns a mutable {@link NormalizedModuleMeta} from the active workspace mapping (`this.map`).
   * Therefore, if you retrieve a {@link NormalizedModuleMeta} using this method and subsequently modify it,
   * the next call will return the already modified {@link NormalizedModuleMeta}.
   *
   * @param moduleId Can be the string alias `'root'`, an explicit module ID, or a `ModRefId` reference.
   * @param throwErrIfNotFound If set to `true`, throws a {@link ModuleIdNotFound} error when the module cannot be resolved.
   */
  getNormalizedModuleMeta(moduleId: ModuleId, throwErrIfNotFound?: boolean): NormalizedModuleMeta | undefined;
  getNormalizedModuleMeta(moduleId: ModuleId, throwErrIfNotFound: true): NormalizedModuleMeta;
  getNormalizedModuleMeta(moduleId: ModuleId, throwErrIfNotFound?: boolean) {
    let normalizedModuleMeta: NormalizedModuleMeta | undefined;
    if (typeof moduleId == 'string') {
      const mapId = this.mapId.get(moduleId);
      if (mapId) {
        normalizedModuleMeta = this.map.get(mapId);
      }
    } else {
      normalizedModuleMeta = this.map.get(moduleId);
    }

    if (throwErrIfNotFound && !normalizedModuleMeta) {
      let moduleName: string;
      if (typeof moduleId == 'string') {
        moduleName = moduleId;
      } else {
        moduleName = getDebugClassName(moduleId) || 'unknown';
      }
      throw new ModuleIdNotFound(moduleName);
    }

    return normalizedModuleMeta;
  }

  /**
   * Registers an instantiated module-level DI {@link Injector} for the specified module reference or ID.
   */
  setInjectorPerMod(moduleId: ModuleId, injectorPerMod: Injector) {
    if (typeof moduleId == 'string') {
      const modRefId = this.mapId.get(moduleId);
      if (modRefId) {
        this.injectorPerModMap.set(modRefId, injectorPerMod);
      } else {
        throw new ModuleIdNotFound(moduleId);
      }
    } else {
      this.injectorPerModMap.set(moduleId, injectorPerMod);
    }
  }

  /**
   * Retrieves the module-level DI {@link Injector} associated with the given module ID or reference.
   */
  getInjectorPerMod(moduleId: ModuleId, throwErrIfNotFound: true): Injector;
  getInjectorPerMod(moduleId: ModuleId, throwErrIfNotFound?: false): Injector | undefined;
  getInjectorPerMod(moduleId: ModuleId, throwErrIfNotFound?: boolean): Injector | undefined {
    let inj: Injector | undefined;
    if (typeof moduleId == 'string') {
      const modRefId = this.mapId.get(moduleId);
      if (modRefId) {
        inj = this.injectorPerModMap.get(modRefId);
      }
    } else {
      inj = this.injectorPerModMap.get(moduleId);
    }

    if (!inj && throwErrIfNotFound) {
      const moduleName = getDebugClassName(moduleId) || 'unknown';
      throw new ModuleIdNotFound(moduleName);
    }
    return inj;
  }

  /**
   * Retrieves the instantiated singleton class instance of a module from its corresponding module-level injector.
   */
  getInstanceOf<T extends AnyObj>(modRefId: ModRefId<T>, throwErrIfNotFound: true): T;
  getInstanceOf<T extends AnyObj>(modRefId: ModRefId<T>, throwErrIfNotFound?: false): T | undefined;
  getInstanceOf(moduleId: ModuleId, throwErrIfNotFound: true): AnyObj;
  getInstanceOf(moduleId: ModuleId, throwErrIfNotFound?: false): AnyObj | undefined;
  getInstanceOf(moduleId: ModuleId, throwErrIfNotFound?: boolean) {
    const modRefId = typeof moduleId == 'string' ? this.mapId.get(moduleId)! : moduleId;
    const Mod = getModule(modRefId);
    if (throwErrIfNotFound === true) {
      // Make TypeScript happy
      return this.getInjectorPerMod(moduleId, true).get(Mod);
    }
    return this.getInjectorPerMod(moduleId, throwErrIfNotFound)?.get(Mod);
  }

  /**
   * Performs a deep clone of a {@link NormalizedModuleMeta} instance by delegating to its internal `clone()` method.
   */
  protected copyNormalizedModuleMeta(normalizedModuleMeta: NormalizedModuleMeta) {
    return normalizedModuleMeta.clone();
  }

  /**
   * Delegates module decorator reflection and metadata normalization to {@link ModuleNormalizer}.
   * On failure, enriches the error message with the full dependency scan trajectory (e.g., `ModuleA -> ModuleB`).
   */
  protected normalizeMeta(modRefId: ModRefId, allModuleMixinsMap: AllModuleMixins): NormalizedModuleMeta {
    try {
      return this.moduleNormalizer.normalize(modRefId, allModuleMixinsMap, this.systemLogMediator);
    } catch (err: any) {
      const moduleName = getDebugClassName(modRefId);
      let path = [...this.unfinishedScanModules].map((id) => getDebugClassName(id)).join(' -> ');
      path = this.unfinishedScanModules.size > 1 ? `${moduleName} (${path})` : `${moduleName}`;
      throw new NormalizationFailure(path, err);
    }
  }

  /**
   * Recursively traverses the module dependency graph (`this.childrenMap`) from `startModule`, propagating parent module mixins
   * down to child modules that have no module mixins of their own. This ensures consistent contextual decorator evaluation
   * across architectural hierarchies (e.g., REST or tRPC routes).
   */
  protected propagateContextMixins(
    startModule: ModRefId,
    inheritedMixins: AllModuleMixins = new Map(),
    visited = new Set<ModRefId>(),
  ) {
    if (visited.has(startModule)) {
      return;
    }
    visited.add(startModule);

    const startMeta = this.map.get(startModule);
    if (!startMeta) {
      return;
    }

    const activeMixins: AllModuleMixins = new Map(inheritedMixins);
    startMeta.moduleMixinMap.forEach((moduleMixin, decoratorId) => {
      activeMixins.set(decoratorId, moduleMixin);
    });

    if (startMeta.moduleMixinMap.size === 0 && activeMixins.size > 0) {
      try {
        this.moduleNormalizer.propagateParentMixins(startMeta, activeMixins);
      } catch (err: any) {
        throw new NormalizationFailure(startMeta.name, err);
      }
    }

    const children = this.childrenMap.get(startModule);
    if (children) {
      for (const child of children) {
        this.propagateContextMixins(child, activeMixins, visited);
      }
    }
  }

  /**
   * Validates all modules in active registries, verifying that no module possesses completely empty metadata
   * (which typically indicates missing module decorators or invalid import structures).
   */
  protected checkEmptyMetaForAllModules() {
    this.map.forEach((meta) => {
      try {
        this.moduleNormalizer.checkEmptyMeta(meta);
      } catch (err: any) {
        throw new NormalizationFailure(meta.name, err);
      }
    });
  }

  /**
   * Identifies module mixins containing `hostMixinOptions` and applies them to their respective host modules.
   * Runs recursively to scan any newly added dependencies triggered by these options.
   */
  protected applyHostMixinOptions() {
    let hasNewModules = true;
    while (hasNewModules) {
      hasNewModules = false;
      const modulesToScan = new Set<ModRefId>();

      this.map.forEach((meta) => {
        meta.moduleMixinMap.forEach((moduleMixin, decoratorId) => {
          if (moduleMixin.hostModule && moduleMixin.hostMixinOptions) {
            const hostMeta = this.map.get(moduleMixin.hostModule);
            if (hostMeta && !hostMeta.moduleMixinMap.has(decoratorId)) {
              hasNewModules = this.applyHostMixinAndGatherDependencies(hostMeta, decoratorId, moduleMixin, modulesToScan);
            }
          }
        });
      });

      this.scanNewlyAddedModules(modulesToScan);
    }
  }

  protected applyHostMixinAndGatherDependencies(
    hostMeta: NormalizedModuleMeta,
    decoratorId: AnyFn,
    moduleMixin: ModuleMixin,
    modulesToScan: Set<ModRefId>,
  ): boolean {
    const newModuleMixin = moduleMixin.clone(moduleMixin.hostMixinOptions);
    hostMeta.moduleMixinMap.set(decoratorId, newModuleMixin);
    try {
      this.moduleNormalizer.applyHostMixinOptions(hostMeta, decoratorId, newModuleMixin);
    } catch (err: any) {
      throw new NormalizationFailure(hostMeta.name, err);
    }

    const importsOrExports: (DynamicModule | StaticModule)[] = [];
    hostMeta.moduleMixinMap.forEach((mixin, dec) => {
      const mixinMeta = hostMeta.normalizedMixinMetaMap.get(dec);
      if (mixinMeta) {
        importsOrExports.push(...mixin.getModulesToScan(mixinMeta));
      }
    });

    const inputs: ModRefId[] = importsOrExports;
    this.propsWithModules.forEach((p) => inputs.push(...hostMeta[p]));

    const children = this.childrenMap.get(hostMeta.modRefId);
    if (children) {
      inputs.forEach((input) => {
        children.add(input);
        if (!this.scannedModules.has(input)) {
          modulesToScan.add(input);
        }
      });
    }

    return true; // Indicates a change occurred
  }

  protected scanNewlyAddedModules(modulesToScan: Set<ModRefId>) {
    for (const input of modulesToScan) {
      if (!this.scannedModules.has(input)) {
        this.unfinishedScanModules.add(input);
        this.scanModule(input);
        this.unfinishedScanModules.delete(input);
        this.scannedModules.add(input);
      }
    }
  }
}
