import { format } from 'node:util';

import { ForwardRefFn, injectable, Injector, Provider, reflector, resolveForwardRef } from '#di';
import { SystemLogMediator } from '#logger/system-log-mediator.js';
import { AnyObj, ModuleType, ModRefId } from '#types/mix.js';
import { ModuleWithParams } from '#types/module-metadata.js';
import { BaseInitMeta, BaseMeta } from '#types/base-meta.js';
import { isModuleWithParams, isRootModule } from '#utils/type-guards.js';
import { clearDebugClassNames, getDebugClassName } from '#utils/get-debug-class-name.js';
import { objectKeys } from '#utils/object-keys.js';
import { ModuleNormalizer } from '#init/module-normalizer.js';
import { AllInitHooks } from '#decorators/init-hooks-and-metadata.js';
import {
  FailAddingToImports,
  FailRemovingImport,
  ForbiddenRollbackEmptyState,
  ModuleIdNotFoundInModuleManager,
  NormalizationFailed,
  ProhibitSavingModulesSnapshot,
  RootNotHaveDecorator,
} from '#errors';

export type ModulesMap = Map<ModRefId, BaseMeta>;
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
  protected propsWithModules = [
    'importsModules',
    'importsWithParams',
    'exportsModules',
    'exportsWithParams',
  ] satisfies (keyof BaseInitMeta)[];

  constructor(protected systemLogMediator: SystemLogMediator) {}

  /**
   * Creates a snapshot of {@link BaseMeta} for the root module, stores locally and returns it.
   * You can also get the result this way: `moduleManager.getMetadata('root')`.
   */
  scanRootModule(appModule: ModuleType): BaseMeta {
    if (this.snapshotMap.size) {
      this.systemLogMediator.forbiddenRescanRootModule(this);
      return this.getBaseMeta('root', true);
    }
    this.providersPerApp = [];
    if (!reflector.getDecorators(appModule, isRootModule)) {
      throw new RootNotHaveDecorator(appModule.name);
    }

    const baseMeta = this.scanModule(appModule);
    this.injectorPerModMap.clear();
    this.unfinishedScanModules.clear();
    this.scanedModules.clear();
    clearDebugClassNames();
    this.mapId.set('root', appModule);
    this.saveSnapshot();
    return baseMeta;
  }

  scanModule(modRefId: ModRefId | ForwardRefFn<ModuleType>, allInitHooks?: AllInitHooks, saveToShapshot?: boolean) {
    allInitHooks ??= new Map();
    modRefId = resolveForwardRef(modRefId);
    const baseMeta = this.normalizeMetadata(modRefId, allInitHooks);
    const importsOrExports: (ModuleWithParams | ModuleType)[] = [];
    baseMeta.mInitHooksAndRawMeta.forEach((initHooks, decorator) => {
      const meta = baseMeta.initMeta.get(decorator);
      if (meta) {
        importsOrExports.push(...initHooks.getModulesToScan(meta));
      }
    });

    // Merging arrays with this props in one array.
    const inputs = this.propsWithModules
      .map((p) => baseMeta[p])
      .reduce<ModRefId[]>((prev, curr) => prev.concat(curr), importsOrExports);

    for (const input of inputs) {
      if (this.unfinishedScanModules.has(input) || this.scanedModules.has(input)) {
        continue;
      }
      this.unfinishedScanModules.add(input);
      this.scanModule(input, baseMeta.allInitHooks, saveToShapshot);
      this.unfinishedScanModules.delete(input);
      this.scanedModules.add(input);
    }

    this.callInitHooksAfterScan(baseMeta);

    if (baseMeta.id) {
      this.mapId.set(baseMeta.id, modRefId);
      this.systemLogMediator.moduleHasId(this, baseMeta.id);
    }
    const providersPerApp = isRootModule(baseMeta) ? [] : baseMeta.providersPerApp;
    this.providersPerApp.push(...providersPerApp);
    if (saveToShapshot) {
      this.snapshotMap.set(modRefId, baseMeta);
    } else {
      this.map.set(modRefId, baseMeta);
    }
    baseMeta.allInitHooks.forEach((initHooks, decorator) => allInitHooks.set(decorator, initHooks));
    return baseMeta;
  }

  /**
   * Returns a mutable {@link BaseMeta}. Therefore, if you retrieve a {@link BaseMeta} from this method and then modify it,
   * the next call to this method will return the already modified {@link BaseMeta}.
   */
  getBaseMeta(moduleId: ModuleId, throwErrIfNotFound?: boolean): BaseMeta | undefined;
  getBaseMeta(moduleId: ModuleId, throwErrIfNotFound: true): BaseMeta;
  getBaseMeta(moduleId: ModuleId, throwErrIfNotFound?: boolean) {
    let baseMeta: BaseMeta | undefined;
    if (typeof moduleId == 'string') {
      const mapId = this.mapId.get(moduleId);
      if (mapId) {
        baseMeta = this.map.get(mapId);
      }
    } else {
      baseMeta = this.map.get(moduleId);
    }

    if (throwErrIfNotFound && !baseMeta) {
      let moduleName: string;
      if (typeof moduleId == 'string') {
        moduleName = moduleId;
      } else {
        moduleName = getDebugClassName(moduleId) || 'unknown';
      }
      throw new ModuleIdNotFoundInModuleManager(moduleName);
    }

    return baseMeta;
  }

  /**
   * If `inputModule` added, returns `true`, otherwise - returns `false`.
   *
   * @param inputModule Module to be added.
   * @param targetModuleId Module ID to which the input module will be added.
   */
  addImport(inputModule: ModRefId, targetModuleId: ModuleId = 'root'): boolean | void {
    const targetBaseMeta = this.getBaseMetaFromSnapshot(targetModuleId);
    if (!targetBaseMeta) {
      const modName = getDebugClassName(inputModule);
      const modIdStr = format(targetModuleId).slice(0, 50);
      throw new FailAddingToImports(modName, modIdStr);
    }

    const prop = isModuleWithParams(inputModule) ? 'importsWithParams' : 'importsModules';
    if (targetBaseMeta[prop].some((imp: ModRefId) => imp === inputModule)) {
      const modIdStr = format(targetModuleId).slice(0, 50);
      this.systemLogMediator.moduleAlreadyImported(this, inputModule, modIdStr);
      return false;
    }

    this.startTransaction();
    try {
      (targetBaseMeta[prop] as ModRefId[]).push(inputModule);
      this.scanModule(inputModule, undefined, true);
      this.systemLogMediator.successfulAddedModuleToImport(this, inputModule, targetBaseMeta.name);
      return true;
    } catch (err) {
      this.rollback(err as Error);
    }
  }

  /**
   * @param targetModuleId Module ID from where the input module will be removed.
   */
  removeImport(inputModuleId: ModuleId, targetModuleId: ModuleId = 'root'): boolean | void {
    const inputBaseMeta = this.getBaseMetaFromSnapshot(inputModuleId);
    if (!inputBaseMeta) {
      const modIdStr = format(inputModuleId).slice(0, 50);
      this.systemLogMediator.moduleNotFound(this, modIdStr);
      return false;
    }

    const targetMeta = this.getBaseMetaFromSnapshot(targetModuleId);
    if (!targetMeta) {
      const modIdStr = format(targetModuleId).slice(0, 50);
      throw new FailRemovingImport(inputBaseMeta.name, modIdStr);
    }
    const prop = isModuleWithParams(inputBaseMeta.modRefId) ? 'importsWithParams' : 'importsModules';
    const index = targetMeta[prop].findIndex((imp: ModRefId) => imp === inputBaseMeta.modRefId);
    if (index == -1) {
      const modIdStr = format(inputModuleId).slice(0, 50);
      this.systemLogMediator.moduleNotFound(this, modIdStr);
      return false;
    }

    this.startTransaction();
    try {
      targetMeta[prop].splice(index, 1);
      if (!this.includesInSomeModule(inputModuleId, 'root')) {
        if (inputBaseMeta.id) {
          this.snapshotMapId.delete(inputBaseMeta.id);
        }
        this.snapshotMap.delete(inputBaseMeta.modRefId);
      }
      this.systemLogMediator.moduleSuccessfulRemoved(this, inputBaseMeta.name, targetMeta.name);
      return true;
    } catch (err) {
      this.rollback(err as Error);
    }
  }

  protected startTransaction() {
    if (this.oldSnapshotMapId.has('root')) {
      // Transaction already started.
      return false;
    }

    this.snapshotMap.forEach((baseMeta, key) => this.oldSnapshotMap.set(key, this.copyBaseMeta(baseMeta)));
    this.oldSnapshotMapId = new Map(this.snapshotMapId);

    return true;
  }

  rollback(err?: Error) {
    if (!this.oldSnapshotMapId.size) {
      throw new ForbiddenRollbackEmptyState();
    }
    this.snapshotMapId = this.oldSnapshotMapId;
    this.snapshotMap = this.oldSnapshotMap;
    this.commit();
    if (err) {
      throw err;
    }
    return this;
  }

  commit() {
    this.oldSnapshotMapId = new Map();
    this.oldSnapshotMap = new Map();
    return this;
  }

  /**
   * Видаляє зміни {@link BaseMeta} усіх модулів.
   */
  reset() {
    this.map = new Map();
    this.snapshotMap.forEach((baseMeta, key) => this.map.set(key, this.copyBaseMeta(baseMeta)));
    this.mapId = new Map(this.snapshotMapId);
    return this;
  }

  /**
   * Returns shapshot of current map for all modules.
   */
  getModulesMap() {
    return new Map(this.map);
  }

  setInjectorPerMod(moduleId: ModuleId, injectorPerMod: Injector) {
    if (typeof moduleId == 'string') {
      const mapId = this.mapId.get(moduleId);
      if (mapId) {
        this.injectorPerModMap.set(mapId, injectorPerMod);
      } else {
        throw new ModuleIdNotFoundInModuleManager(moduleId);
      }
    } else {
      this.injectorPerModMap.set(moduleId, injectorPerMod);
    }
  }

  getInjectorPerMod(moduleId: ModuleId) {
    if (typeof moduleId == 'string') {
      const mapId = this.mapId.get(moduleId);
      if (mapId) {
        return this.injectorPerModMap.get(mapId)!;
      } else {
        throw new ModuleIdNotFoundInModuleManager(moduleId);
      }
    } else {
      return this.injectorPerModMap.get(moduleId)!;
    }
  }

  protected getBaseMetaFromSnapshot(moduleId: ModuleId) {
    let baseMeta: BaseMeta | undefined;
    if (typeof moduleId == 'string') {
      const mapId = this.snapshotMapId.get(moduleId);
      if (mapId) {
        baseMeta = this.snapshotMap.get(mapId);
      }
    } else {
      baseMeta = this.snapshotMap.get(moduleId);
    }

    return baseMeta;
  }

  /**
   * The current module may sometimes lack the init decorators that are present in imported modules.
   * In such cases, after scanning all imported modules, the collected init hooks from them are also
   * executed for the current module. The result of executing these init hooks is objects with initialized
   * properties, into which certain metadata can later be imported.
   */
  protected callInitHooksAfterScan(baseMeta: BaseMeta) {
    baseMeta.allInitHooks.forEach((initHooks, decorator) => {
      if (!baseMeta.mInitHooksAndRawMeta.has(decorator)) {
        const meta = initHooks.clone().normalize(baseMeta);
        if (meta) {
          baseMeta.initMeta.set(decorator, meta);
        }
      }
    });
  }

  protected copyBaseMeta(baseMeta: BaseMeta) {
    baseMeta = { ...(baseMeta || ({} as BaseMeta)) };

    objectKeys(baseMeta).forEach((p) => {
      if (Array.isArray(baseMeta[p])) {
        (baseMeta as any)[p] = baseMeta[p].slice();
      }
    });
    return baseMeta;
  }

  /**
   * Recursively searches for input module.
   * Returns true if input module includes in imports/exports of target module.
   *
   * @param inputModuleId The module you need to find.
   * @param targetModuleId Module where to search `inputModule`.
   */
  protected includesInSomeModule(inputModuleId: ModuleId, targetModuleId: ModuleId): boolean {
    const targetMeta = this.getBaseMetaFromSnapshot(targetModuleId);
    if (!targetMeta) {
      return false;
    }

    const aModRefId = this.propsWithModules
      .map((p) => targetMeta[p])
      .reduce<ModRefId[]>((prev, curr) => prev.concat(curr), []);

    return (
      aModRefId.some((modRefId) => inputModuleId === modRefId) ||
      aModRefId.some((modRefId) => this.includesInSomeModule(inputModuleId, modRefId))
    );
  }

  protected normalizeMetadata(modRefId: ModRefId, allInitHooks: AllInitHooks): BaseMeta {
    try {
      return this.moduleNormalizer.normalize(modRefId, allInitHooks);
    } catch (err: any) {
      const moduleName = getDebugClassName(modRefId);
      let path = [...this.unfinishedScanModules].map((id) => getDebugClassName(id)).join(' -> ');
      path = this.unfinishedScanModules.size > 1 ? `${moduleName} (${path})` : `${moduleName}`;
      throw new NormalizationFailed(path, err);
    }
  }

  protected saveSnapshot() {
    if (this.snapshotMap.size) {
      throw new ProhibitSavingModulesSnapshot();
    } else {
      this.map.forEach((baseMeta, modRefId) => this.snapshotMap.set(modRefId, this.copyBaseMeta(baseMeta)));
      this.snapshotMapId = new Map(this.mapId);
    }
  }
}
