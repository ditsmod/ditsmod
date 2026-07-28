import { format } from 'node:util';

import { SystemLogMediator } from '#logger/system-log-mediator.js';
import { AnyObj } from '#types/mix.js';
import { StaticModule, ModRefId } from '#decorators/module-decorator-options.js';
import { DynamicModule } from '#decorators/module-decorator-options.js';
import { NormalizedInitMeta, NormalizedModuleMeta } from '#init/normalized-meta.js';
import { isDynamicModule, isRootModule } from '#decorators/type-guards.js';
import { clearDebugClassNames, getDebugClassName } from '#utils/get-debug-class-name.js';
import { objectKeys } from '#utils/object-keys.js';
import { ModuleNormalizer } from '#init/module-normalizer.js';
import { AllInitHooks } from '#decorators/init-hooks-and-metadata.js';
import {
  ImportAdditionFailure,
  ImportRemovalFailure,
  ForbiddenRollback,
  ModuleIdNotFound,
  NormalizationFailure,
  ForbiddenSavingSnapshot,
  MissingRootDecorator,
} from '#errors';
import { getModule } from '#utils/get-module.js';
import { injectable } from '#di/decorators.js';
import type { Provider } from '#di/top/types-and-models.js';
import type { Injector } from '#di/injector.js';
import { Reflector } from '#di/reflector.js';
import { resolveForwardRef, type ForwardRefFn } from '#di/forward-ref.js';

export type ModulesMap = Map<ModRefId, NormalizedModuleMeta>;
export type ModulesMapId = Map<string, ModRefId>;
export type ModuleId = string | ModRefId;

/**
 * Recursively scans metadata attached to module classes via decorators, normalizes it, and validates it.
 * As a result of this process, a mapping is created between the module reference (`ModRefId`) and its normalized metadata.
 * Essentially, `ModRefId` is the form in which a module is passed in the `imports` array — that is,
 * either the static module class itself (`StaticModule`) or a dynamic module configuration object (`DynamicModule`).
 *
 * `ModuleManager` also stores module-level DI injectors, manages application-scoped providers, propagates initialization hooks,
 * and enables dynamic runtime modifications to module imports with atomic transaction support (rollback and commit).
 */
@injectable()
export class ModuleManager {
  providersPerApp: Provider[] = [];
  protected injectorPerModMap = new Map<ModRefId, Injector>();
  protected map: ModulesMap = new Map();
  protected snapshotMap: ModulesMap = new Map();
  protected snapshotMapId = new Map<string, ModRefId>();
  protected oldSnapshotMap: ModulesMap = new Map();
  protected oldSnapshotMapId = new Map<string, ModRefId>();
  protected mapId = new Map<'root' | (string & {}), ModRefId>();
  protected unfinishedScanModules = new Set<ModRefId>();
  protected scannedModules = new Set<ModRefId>();
  protected moduleNormalizer = new ModuleNormalizer();
  protected childrenMap = new Map<ModRefId, Set<ModRefId>>();
  protected oldChildrenMap = new Map<ModRefId, Set<ModRefId>>();
  protected propsWithModules = [
    'importedStaticModules',
    'importedDynamicModules',
    'exportedStaticModules',
    'exportedDynamicModules',
  ] satisfies (keyof NormalizedInitMeta)[];

  constructor(protected systemLogMediator: SystemLogMediator) {}

  /**
   * Creates an immutable snapshot of {@link NormalizedModuleMeta} for the root module, stores it locally, and returns it.
   * You can later retrieve the result via: `moduleManager.getNormalizedModuleMeta('root')`.
   *
   * Resets internal scan state and initiates recursive metadata resolution for all imported feature modules in the dependency graph.
   */
  scanRootModule(appModule: StaticModule): NormalizedModuleMeta {
    if (this.snapshotMap.size) {
      this.systemLogMediator.forbiddenRescanRootModule(this);
      return this.getNormalizedModuleMeta('root', true);
    }
    this.providersPerApp = [];
    if (!Reflector.getClassLevelMeta(appModule, isRootModule)) {
      throw new MissingRootDecorator(appModule.name);
    }

    this.childrenMap.clear();
    const normalizedModuleMeta = this.scanModule(appModule);

    this.injectorPerModMap.clear();
    this.unfinishedScanModules.clear();
    this.scannedModules.clear();
    clearDebugClassNames();
    this.mapId.set('root', appModule);
    this.saveSnapshot();
    return normalizedModuleMeta;
  }

  /**
   * Recursively normalizes and registers metadata for a specified static or dynamic module reference.
   *
   * Traverses module dependencies (`imports`, `exports`, and modules discovered via specialized init hooks such as `appends`
   * or `controllers`), builds the module dependency graph (`childrenMap`), accumulates global providers into `providersPerApp`,
   * and executes initialization hooks across the hierarchy.
   */
  scanModule(modRefId: ModRefId | ForwardRefFn<StaticModule>, allInitHooks?: AllInitHooks, saveToSnapshot?: boolean) {
    const isRootScan = this.unfinishedScanModules.size == 0;
    allInitHooks ??= new Map();
    modRefId = resolveForwardRef(modRefId);
    const normalizedModuleMeta = this.normalizeMeta(modRefId, allInitHooks);
    const importsOrExports: (DynamicModule | StaticModule)[] = [];
    normalizedModuleMeta.initHooksMap.forEach((initHooks, decorator) => {
      const meta = normalizedModuleMeta.initMeta.get(decorator);
      if (meta) {
        importsOrExports.push(...initHooks.getModulesToScan(meta));
      }
    });

    // Merging arrays with this props in one array.
    const inputs = this.propsWithModules
      .map((p) => normalizedModuleMeta[p])
      .reduce<ModRefId[]>((prev, curr) => prev.concat(curr), importsOrExports);

    const children = new Set<ModRefId>();
    this.childrenMap.set(normalizedModuleMeta.modRefId, children);

    for (const input of inputs) {
      children.add(input);
      if (this.unfinishedScanModules.has(input) || this.scannedModules.has(input)) {
        continue;
      }
      this.unfinishedScanModules.add(input);
      this.scanModule(input, normalizedModuleMeta.allInitHooks, saveToSnapshot);
      this.unfinishedScanModules.delete(input);
      this.scannedModules.add(input);
    }

    this.callInitHooksAfterScan(normalizedModuleMeta);

    if (normalizedModuleMeta.id) {
      this.mapId.set(normalizedModuleMeta.id, modRefId);
      this.systemLogMediator.moduleHasId(this, normalizedModuleMeta.id);
    }
    const providersPerApp = isRootModule(normalizedModuleMeta) ? [] : normalizedModuleMeta.providersPerApp;
    this.providersPerApp.push(...providersPerApp);
    if (saveToSnapshot) {
      this.snapshotMap.set(modRefId, normalizedModuleMeta);
    } else {
      this.map.set(modRefId, normalizedModuleMeta);
    }
    normalizedModuleMeta.allInitHooks.forEach((initHooks, decorator) => allInitHooks.set(decorator, initHooks));

    if (isRootScan) {
      const rootModule = this.mapId.get('root') || resolveForwardRef(modRefId);
      this.propagateContextHooks(rootModule);
      this.checkEmptyMetaForAllModules();
    }

    return normalizedModuleMeta;
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
   * Dynamically appends a new module (`inputModule`) to the imports of a specified target module in the snapshot mapping.
   * This operation runs within a transaction; if recursive scanning or normalization of the added module fails,
   * all changes are rolled back to the previous snapshot state.
   *
   * Returns `true` if `inputModule` was successfully added, or `false` if it was already imported or could not be processed.
   *
   * @param inputModule Module to be added (`StaticModule` or `DynamicModule`).
   * @param targetModuleId Module ID to which the input module will be added (defaults to `'root'`).
   */
  addImport(inputModule: ModRefId, targetModuleId: ModuleId = 'root'): boolean | void {
    const targetNormalizedModuleMeta = this.getNormalizedModuleMetaFromSnapshot(targetModuleId);
    if (!targetNormalizedModuleMeta) {
      const modName = getDebugClassName(inputModule);
      const modIdStr = format(targetModuleId).slice(0, 50);
      throw new ImportAdditionFailure(modName, modIdStr);
    }

    const prop = isDynamicModule(inputModule) ? 'importedDynamicModules' : 'importedStaticModules';
    if (targetNormalizedModuleMeta[prop].some((imp: ModRefId) => imp === inputModule)) {
      const modIdStr = format(targetModuleId).slice(0, 50);
      this.systemLogMediator.moduleAlreadyImported(this, inputModule, modIdStr);
      return false;
    }

    this.startTransaction();
    try {
      (targetNormalizedModuleMeta[prop] as ModRefId[]).push(inputModule);
      let children = this.childrenMap.get(targetNormalizedModuleMeta.modRefId);
      if (!children) {
        children = new Set();
        this.childrenMap.set(targetNormalizedModuleMeta.modRefId, children);
      }
      children.add(inputModule);

      this.scanModule(inputModule, undefined, true);
      this.systemLogMediator.successfulAddedModuleToImport(this, inputModule, targetNormalizedModuleMeta.name);
      return true;
    } catch (err) {
      this.rollback(err as Error);
    }
  }

  /**
   * Removes an imported module from a target module's import array within the snapshot mapping.
   * Runs inside a transaction; if the removed module is no longer referenced anywhere within the application module graph,
   * its normalized metadata and child relationships are safely garbage collected.
   *
   * Returns `true` if removed successfully, or `false` if the target or imported module was not found.
   *
   * @param inputModuleId Module ID or reference to remove from imports.
   * @param targetModuleId Module ID from where the input module will be removed (defaults to `'root'`).
   */
  removeImport(inputModuleId: ModuleId, targetModuleId: ModuleId = 'root'): boolean | void {
    const inputNormalizedModuleMeta = this.getNormalizedModuleMetaFromSnapshot(inputModuleId);
    if (!inputNormalizedModuleMeta) {
      const modIdStr = format(inputModuleId).slice(0, 50);
      this.systemLogMediator.moduleNotFound(this, modIdStr);
      return false;
    }

    const targetMeta = this.getNormalizedModuleMetaFromSnapshot(targetModuleId);
    if (!targetMeta) {
      const modIdStr = format(targetModuleId).slice(0, 50);
      throw new ImportRemovalFailure(inputNormalizedModuleMeta.name, modIdStr);
    }
    const prop = isDynamicModule(inputNormalizedModuleMeta.modRefId)
      ? 'importedDynamicModules'
      : 'importedStaticModules';
    const index = targetMeta[prop].findIndex((imp: ModRefId) => imp === inputNormalizedModuleMeta.modRefId);
    if (index == -1) {
      const modIdStr = format(inputModuleId).slice(0, 50);
      this.systemLogMediator.moduleNotFound(this, modIdStr);
      return false;
    }

    this.startTransaction();
    try {
      targetMeta[prop].splice(index, 1);
      const targetChildren = this.childrenMap.get(targetMeta.modRefId);
      if (targetChildren) {
        targetChildren.delete(inputNormalizedModuleMeta.modRefId);
      }
      if (!this.includesInSomeModule(inputModuleId, 'root')) {
        if (inputNormalizedModuleMeta.id) {
          this.snapshotMapId.delete(inputNormalizedModuleMeta.id);
        }
        this.snapshotMap.delete(inputNormalizedModuleMeta.modRefId);
        this.childrenMap.delete(inputNormalizedModuleMeta.modRefId);
      }
      this.systemLogMediator.moduleSuccessfulRemoved(this, inputNormalizedModuleMeta.name, targetMeta.name);
      return true;
    } catch (err) {
      this.rollback(err as Error);
    }
  }

  /**
   * Initiates an atomic transaction by saving backups of the current snapshot maps and dependency hierarchies.
   * Returns `true` if a new transaction was started, or `false` if a transaction is already active.
   */
  startTransaction() {
    if (this.oldSnapshotMapId.has('root')) {
      // Transaction already started.
      return false;
    }

    this.snapshotMap.forEach((normalizedModuleMeta, key) =>
      this.oldSnapshotMap.set(key, this.copyNormalizedModuleMeta(normalizedModuleMeta)),
    );
    this.oldSnapshotMapId = new Map(this.snapshotMapId);

    this.oldChildrenMap = new Map();
    this.childrenMap.forEach((val, key) => {
      this.oldChildrenMap.set(key, new Set(val));
    });

    return true;
  }

  /**
   * Reverts all snapshot mappings and child relationships back to the state saved when {@link startTransaction} was called.
   * Automatically commits (clears backup history) after restoring state.
   *
   * @throws ForbiddenRollback if invoked without an active transaction.
   */
  rollback(err?: Error) {
    if (!this.oldSnapshotMapId.size) {
      throw new ForbiddenRollback();
    }
    this.snapshotMapId = this.oldSnapshotMapId;
    this.snapshotMap = this.oldSnapshotMap;
    this.childrenMap = this.oldChildrenMap;
    this.commit();
    if (err) {
      throw err;
    }
    return this;
  }

  /**
   * Successfully finishes the active transaction by clearing the backed-up historical snapshot maps.
   */
  commit() {
    this.oldSnapshotMapId = new Map();
    this.oldSnapshotMap = new Map();
    this.oldChildrenMap = new Map();
    return this;
  }

  /**
   * Resets any modifications made to {@link NormalizedModuleMeta} in the active workspace mapping (`this.map`)
   * by restoring fresh deep clones from the immutable snapshot map (`this.snapshotMap`).
   */
  reset() {
    this.map = new Map();
    this.snapshotMap.forEach((normalizedModuleMeta, key) =>
      this.map.set(key, this.copyNormalizedModuleMeta(normalizedModuleMeta)),
    );
    this.mapId = new Map(this.snapshotMapId);
    return this;
  }

  /**
   * Returns a shallow copy of the active mapping between module reference IDs (`ModRefId`) and their {@link NormalizedModuleMeta}.
   */
  getModulesMap() {
    return new Map(this.map);
  }

  /**
   * Returns the internal registry mapping module reference IDs (`ModRefId`) to their instantiated module-level injectors.
   */
  getInjectorsPerMod() {
    return this.injectorPerModMap;
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
   * Retrieves immutable {@link NormalizedModuleMeta} directly from the saved snapshot map, resolving string aliases if necessary.
   */
  protected getNormalizedModuleMetaFromSnapshot(moduleId: ModuleId) {
    let normalizedModuleMeta: NormalizedModuleMeta | undefined;
    if (typeof moduleId == 'string') {
      const mapId = this.snapshotMapId.get(moduleId);
      if (mapId) {
        normalizedModuleMeta = this.snapshotMap.get(mapId);
      }
    } else {
      normalizedModuleMeta = this.snapshotMap.get(moduleId);
    }

    return normalizedModuleMeta;
  }

  /**
   * The current module may sometimes lack explicit init decorators that are present in imported modules
   * (for example, importing an architectural feature module without decorating the importer).
   * In such cases, after scanning all imported modules, the collected init hooks from them are also
   * executed for the current module. The result of executing these init hooks is objects with initialized
   * properties, into which relevant metadata (such as controllers or appended routes) can later be imported.
   */
  protected callInitHooksAfterScan(normalizedModuleMeta: NormalizedModuleMeta) {
    normalizedModuleMeta.allInitHooks.forEach((initHooks, decorator) => {
      if (!normalizedModuleMeta.initHooksMap.has(decorator)) {
        const meta = initHooks.clone().normalize(normalizedModuleMeta);
        if (meta) {
          normalizedModuleMeta.initMeta.set(decorator, meta);
        }
      }
    });
  }

  /**
   * Performs a deep clone of a {@link NormalizedModuleMeta} instance, duplicating arrays, maps, and extension metadata
   * while re-evaluating init hooks to maintain isolated metadata structures across resets and transactions.
   */
  protected copyNormalizedModuleMeta(normalizedModuleMeta: NormalizedModuleMeta) {
    const copy = Object.create(
      Object.getPrototypeOf(normalizedModuleMeta || ({} as NormalizedModuleMeta)),
    ) as NormalizedModuleMeta;
    Object.assign(copy, normalizedModuleMeta);

    objectKeys(copy).forEach((p) => {
      if (Array.isArray(copy[p])) {
        (copy as any)[p] = copy[p].slice();
      }
    });

    if (copy.extensionsMeta) {
      copy.extensionsMeta = { ...copy.extensionsMeta };
    }
    copy.initHooksMap = new Map(copy.initHooksMap);
    copy.allInitHooks = new Map(copy.allInitHooks);
    copy.extensionGroupTokenMap = new Map(copy.extensionGroupTokenMap);
    copy.exportedExtensionGroupTokenMap = new Map(copy.exportedExtensionGroupTokenMap);
    copy.initMeta = new Map();
    copy.initHooksMap.forEach((initHooks, decorator) => {
      const meta = initHooks.normalize(copy);
      if (meta) {
        copy.initMeta.set(decorator, meta);
      }
    });
    copy.allInitHooks.forEach((initHooks, decorator) => {
      if (!copy.initHooksMap.has(decorator)) {
        const meta = initHooks.clone().normalize(copy);
        if (meta) {
          copy.initMeta.set(decorator, meta);
        }
      }
    });

    return copy;
  }

  /**
   * Recursively searches for an input module across the dependency tree.
   * Returns `true` if `inputModuleId` is included in the static or dynamic imports/exports of `targetModuleId` or its submodules.
   *
   * @param inputModuleId The target module reference or ID to find.
   * @param targetModuleId Module within which to search for `inputModuleId`.
   */
  protected includesInSomeModule(
    inputModuleId: ModuleId,
    targetModuleId: ModuleId,
    visited = new Set<ModuleId>(),
  ): boolean {
    if (visited.has(targetModuleId)) {
      return false;
    }
    visited.add(targetModuleId);

    const targetMeta = this.getNormalizedModuleMetaFromSnapshot(targetModuleId);
    if (!targetMeta) {
      return false;
    }
    if (targetMeta.modRefId !== targetModuleId) {
      if (visited.has(targetMeta.modRefId)) {
        return false;
      }
      visited.add(targetMeta.modRefId);
    }

    const modRefIds = this.propsWithModules
      .map((p) => targetMeta[p])
      .reduce<ModRefId[]>((prev, curr) => prev.concat(curr), []);

    return (
      modRefIds.some((modRefId) => inputModuleId === modRefId) ||
      modRefIds.some((modRefId) => this.includesInSomeModule(inputModuleId, modRefId, visited))
    );
  }

  /**
   * Delegates module decorator reflection and metadata normalization to {@link ModuleNormalizer}.
   * On failure, enriches the error message with the full dependency scan trajectory (e.g., `ModuleA -> ModuleB`).
   */
  protected normalizeMeta(modRefId: ModRefId, allInitHooks: AllInitHooks): NormalizedModuleMeta {
    try {
      return this.moduleNormalizer.normalize(modRefId, allInitHooks, this.systemLogMediator);
    } catch (err: any) {
      const moduleName = getDebugClassName(modRefId);
      let path = [...this.unfinishedScanModules].map((id) => getDebugClassName(id)).join(' -> ');
      path = this.unfinishedScanModules.size > 1 ? `${moduleName} (${path})` : `${moduleName}`;
      throw new NormalizationFailure(path, err);
    }
  }

  /**
   * Freezes the initialized module metadata mapping into an immutable baseline snapshot (`this.snapshotMap`).
   * Throws {@link ForbiddenSavingSnapshot} if a snapshot has already been established.
   */
  protected saveSnapshot() {
    if (this.snapshotMap.size) {
      throw new ForbiddenSavingSnapshot();
    } else {
      this.map.forEach((normalizedModuleMeta, modRefId) =>
        this.snapshotMap.set(modRefId, this.copyNormalizedModuleMeta(normalizedModuleMeta)),
      );
      this.snapshotMapId = new Map(this.mapId);
    }
  }

  /**
   * Recursively traverses the module dependency graph (`childrenMap`) from `startModule`, propagating parent init hooks
   * down to child modules that have no init hooks of their own. This ensures consistent contextual decorator evaluation
   * across architectural hierarchies (e.g., REST or tRPC routes).
   */
  protected propagateContextHooks(
    startModule: ModRefId,
    inheritedHooks: AllInitHooks = new Map(),
    visited = new Set<ModRefId>(),
  ) {
    if (visited.has(startModule)) {
      return;
    }
    visited.add(startModule);

    const startMeta = this.map.get(startModule) || this.snapshotMap.get(startModule);
    if (!startMeta) {
      return;
    }

    const activeHooks: AllInitHooks = new Map(inheritedHooks);
    startMeta.initHooksMap.forEach((initHooks, decorator) => {
      activeHooks.set(decorator, initHooks);
    });

    if (startMeta.initHooksMap.size === 0 && activeHooks.size > 0) {
      try {
        this.moduleNormalizer.propagateParentHooks(startMeta, activeHooks);
      } catch (err: any) {
        throw new NormalizationFailure(startMeta.name, err);
      }
    }

    const children = this.childrenMap.get(startModule);
    if (children) {
      for (const child of children) {
        this.propagateContextHooks(child, activeHooks, visited);
      }
    }
  }

  /**
   * Validates all modules in both active and snapshot registries, verifying that no module possesses completely empty metadata
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
    this.snapshotMap.forEach((meta) => {
      try {
        this.moduleNormalizer.checkEmptyMeta(meta);
      } catch (err: any) {
        throw new NormalizationFailure(meta.name, err);
      }
    });
  }
}
