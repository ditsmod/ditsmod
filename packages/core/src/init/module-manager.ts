import { format } from 'node:util';

import { SystemLogMediator } from '#logger/system-log-mediator.js';
import { AnyObj, ModuleType, ModRefId } from '#types/mix.js';
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
 * As a result of this process, a mapping is created between the class's `modRefId` and its normalized data.
 * Essentially, `modRefId` is the form in which a module is passed in the `imports` array — that is,
 * either the module class itself or an object containing the module with parameters.
 *
 * The `ModuleManager` can also add or remove modules from the imports.
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
  protected scanedModules = new Set<ModRefId>();
  protected moduleNormalizer = new ModuleNormalizer();
  protected childrenMap = new Map<ModRefId, Set<ModRefId>>();
  protected oldChildrenMap = new Map<ModRefId, Set<ModRefId>>();
  protected propsWithModules = [
    'importsModules',
    'importsWithOpts',
    'exportsModules',
    'exportsWithOpts',
  ] satisfies (keyof NormalizedInitMeta)[];

  constructor(protected systemLogMediator: SystemLogMediator) {}

  /**
   * Creates a snapshot of {@link NormalizedModuleMeta} for the root module, stores locally and returns it.
   * You can also get the result this way: `moduleManager.getMetadata('root')`.
   */
  scanRootModule(appModule: ModuleType): NormalizedModuleMeta {
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
    this.scanedModules.clear();
    clearDebugClassNames();
    this.mapId.set('root', appModule);
    this.saveSnapshot();
    return normalizedModuleMeta;
  }

  scanModule(modRefId: ModRefId | ForwardRefFn<ModuleType>, allInitHooks?: AllInitHooks, saveToShapshot?: boolean) {
    const isRootScan = this.unfinishedScanModules.size === 0;
    allInitHooks ??= new Map();
    modRefId = resolveForwardRef(modRefId);
    const normalizedModuleMeta = this.normalizeMeta(modRefId, allInitHooks);
    const importsOrExports: (DynamicModule | ModuleType)[] = [];
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
      if (this.unfinishedScanModules.has(input) || this.scanedModules.has(input)) {
        continue;
      }
      this.unfinishedScanModules.add(input);
      this.scanModule(input, normalizedModuleMeta.allInitHooks, saveToShapshot);
      this.unfinishedScanModules.delete(input);
      this.scanedModules.add(input);
    }

    this.callInitHooksAfterScan(normalizedModuleMeta);

    if (normalizedModuleMeta.id) {
      this.mapId.set(normalizedModuleMeta.id, modRefId);
      this.systemLogMediator.moduleHasId(this, normalizedModuleMeta.id);
    }
    const providersPerApp = isRootModule(normalizedModuleMeta) ? [] : normalizedModuleMeta.providersPerApp;
    this.providersPerApp.push(...providersPerApp);
    if (saveToShapshot) {
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
   * Returns a mutable {@link NormalizedModuleMeta}. Therefore, if you retrieve a {@link NormalizedModuleMeta} from this method and then modify it,
   * the next call to this method will return the already modified {@link NormalizedModuleMeta}.
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
   * If `inputModule` added, returns `true`, otherwise - returns `false`.
   *
   * @param inputModule Module to be added.
   * @param targetModuleId Module ID to which the input module will be added.
   */
  addImport(inputModule: ModRefId, targetModuleId: ModuleId = 'root'): boolean | void {
    const targetNormalizedModuleMeta = this.getNormalizedModuleMetaFromSnapshot(targetModuleId);
    if (!targetNormalizedModuleMeta) {
      const modName = getDebugClassName(inputModule);
      const modIdStr = format(targetModuleId).slice(0, 50);
      throw new ImportAdditionFailure(modName, modIdStr);
    }

    const prop = isDynamicModule(inputModule) ? 'importsWithOpts' : 'importsModules';
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
   * @param targetModuleId Module ID from where the input module will be removed.
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
    const prop = isDynamicModule(inputNormalizedModuleMeta.modRefId) ? 'importsWithOpts' : 'importsModules';
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

  commit() {
    this.oldSnapshotMapId = new Map();
    this.oldSnapshotMap = new Map();
    this.oldChildrenMap = new Map();
    return this;
  }

  /**
   * Resets changes made to {@link NormalizedModuleMeta} after normalization.
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
   * Returns shapshot of current map for all modules.
   */
  getModulesMap() {
    return new Map(this.map);
  }

  getInjectorsPerMod() {
    return this.injectorPerModMap;
  }

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
   * Returns instance of a module.
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
   * The current module may sometimes lack the init decorators that are present in imported modules.
   * In such cases, after scanning all imported modules, the collected init hooks from them are also
   * executed for the current module. The result of executing these init hooks is objects with initialized
   * properties, into which certain metadata can later be imported.
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
   * Recursively searches for input module.
   * Returns true if input module includes in imports/exports of target module.
   *
   * @param inputModuleId The module you need to find.
   * @param targetModuleId Module where to search `inputModule`.
   */
  protected includesInSomeModule(inputModuleId: ModuleId, targetModuleId: ModuleId): boolean {
    const targetMeta = this.getNormalizedModuleMetaFromSnapshot(targetModuleId);
    if (!targetMeta) {
      return false;
    }

    const modRefIds = this.propsWithModules
      .map((p) => targetMeta[p])
      .reduce<ModRefId[]>((prev, curr) => prev.concat(curr), []);

    return (
      modRefIds.some((modRefId) => inputModuleId === modRefId) ||
      modRefIds.some((modRefId) => this.includesInSomeModule(inputModuleId, modRefId))
    );
  }

  protected normalizeMeta(modRefId: ModRefId, allInitHooks: AllInitHooks): NormalizedModuleMeta {
    try {
      return this.moduleNormalizer.normalize(modRefId, allInitHooks);
    } catch (err: any) {
      const moduleName = getDebugClassName(modRefId);
      let path = [...this.unfinishedScanModules].map((id) => getDebugClassName(id)).join(' -> ');
      path = this.unfinishedScanModules.size > 1 ? `${moduleName} (${path})` : `${moduleName}`;
      throw new NormalizationFailure(path, err);
    }
  }

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
