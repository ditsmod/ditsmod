import { format } from 'node:util';

import { injectable, Injector, Provider, reflector } from '#di';
import { SystemLogMediator } from '#logger/system-log-mediator.js';
import { AnyObj, ModuleType, ModRefId } from '#types/mix.js';
import { ModuleWithParams } from '#types/module-metadata.js';
import { BaseMeta } from '#types/base-meta.js';
import { isModuleWithParams, isRootModule } from '#utils/type-guards.js';
import { clearDebugClassNames, getDebugClassName } from '#utils/get-debug-class-name.js';
import { objectKeys } from '#utils/object-keys.js';
import { ModuleNormalizer } from '#init/module-normalizer.js';
import { AllInitHooks } from '#decorators/init-hooks-and-metadata.js';
import { CustomError } from '#error/custom-error.js';

export type ModulesMap = Map<ModRefId, BaseMeta>;
export type ModulesMapId = Map<string, ModRefId>;
type ModuleId = string | ModRefId;

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
  protected mapId = new Map<'root' | (string & {}), ModRefId>();
  protected oldMap: ModulesMap = new Map();
  protected oldMapId = new Map<string, ModRefId>();
  protected unfinishedScanModules = new Set<ModRefId>();
  protected scanedModules = new Set<ModRefId>();
  protected moduleNormalizer = new ModuleNormalizer();
  protected propsWithModules = ['importsModules', 'importsWithParams', 'exportsModules', 'exportsWithParams'] as const;

  constructor(protected systemLogMediator: SystemLogMediator) {}

  /**
   * Creates a snapshot of `BaseMeta` for the root module, stores locally and returns it.
   * You can also get the result this way: `moduleManager.getMetadata('root')`.
   */
  scanRootModule(appModule: ModuleType) {
    this.providersPerApp = [];
    if (!reflector.getDecorators(appModule, isRootModule)) {
      throw new Error(`Module scaning failed: "${appModule.name}" does not have the "@rootModule()" decorator`);
    }

    const baseMeta = this.scanRawModule(appModule);
    this.injectorPerModMap.clear();
    this.unfinishedScanModules.clear();
    this.scanedModules.clear();
    clearDebugClassNames();
    this.mapId.set('root', appModule);
    return this.copyBaseMeta(baseMeta);
  }

  /**
   * Returns a snapshot of `BaseMeta` for a module.
   */
  scanModule(modOrObj: ModuleType | ModuleWithParams) {
    const baseMeta = this.scanRawModule(modOrObj);
    return this.copyBaseMeta(baseMeta);
  }

  /**
   * Returns a snapshot of `BaseMeta` for given module or module ID.
   * If this snapshot is later mutated outside of `ModuleManager`, it does not affect
   * the new snapshot that later returns this method.
   */
  getMetadata<T extends AnyObj = AnyObj, A extends AnyObj = AnyObj>(
    moduleId: ModuleId,
    throwErrIfNotFound?: false,
  ): BaseMeta | undefined;
  getMetadata<T extends AnyObj = AnyObj, A extends AnyObj = AnyObj>(
    moduleId: ModuleId,
    throwErrIfNotFound: true,
  ): BaseMeta;
  getMetadata<T extends AnyObj = AnyObj, A extends AnyObj = AnyObj>(moduleId: ModuleId, throwErrIfNotFound?: boolean) {
    const baseMeta = this.getOriginMetadata<T, A>(moduleId, throwErrIfNotFound);
    if (baseMeta) {
      return this.copyBaseMeta(baseMeta);
    } else {
      return;
    }
  }

  /**
   * If `inputModule` added, returns `true`, otherwise - returns `false`.
   *
   * @param inputModule Module to be added.
   * @param targetModuleId Module ID to which the input module will be added.
   */
  addImport(inputModule: ModRefId, targetModuleId: ModuleId = 'root'): boolean | void {
    const targetMeta = this.getOriginMetadata(targetModuleId);
    if (!targetMeta) {
      const modName = getDebugClassName(inputModule);
      const modIdStr = format(targetModuleId).slice(0, 50);
      const msg = `Failed adding ${modName} to imports: target module with ID "${modIdStr}" not found.`;
      throw new Error(msg);
    }

    const prop = isModuleWithParams(inputModule) ? 'importsWithParams' : 'importsModules';
    if (targetMeta[prop].some((imp: ModRefId) => imp === inputModule)) {
      const modIdStr = format(targetModuleId).slice(0, 50);
      this.systemLogMediator.moduleAlreadyImported(this, inputModule, modIdStr);
      return false;
    }

    this.startTransaction();
    try {
      (targetMeta[prop] as ModRefId[]).push(inputModule);
      this.scanRawModule(inputModule);
      this.systemLogMediator.successfulAddedModuleToImport(this, inputModule, targetMeta.name);
      return true;
    } catch (err) {
      this.rollback(err as Error);
    }
  }

  /**
   * @param targetModuleId Module ID from where the input module will be removed.
   */
  removeImport(inputModuleId: ModuleId, targetModuleId: ModuleId = 'root'): boolean | void {
    const inputMeta = this.getOriginMetadata(inputModuleId);
    if (!inputMeta) {
      const modIdStr = format(inputModuleId).slice(0, 50);
      this.systemLogMediator.moduleNotFound(this, modIdStr);
      return false;
    }

    const targetMeta = this.getOriginMetadata(targetModuleId);
    if (!targetMeta) {
      const modIdStr = format(targetModuleId).slice(0, 50);
      const msg = `Failed removing ${inputMeta.name} from "imports" array: target module with ID "${modIdStr}" not found.`;
      throw new Error(msg);
    }
    const prop = isModuleWithParams(inputMeta.modRefId) ? 'importsWithParams' : 'importsModules';
    const index = targetMeta[prop].findIndex((imp: ModRefId) => imp === inputMeta.modRefId);
    if (index == -1) {
      const modIdStr = format(inputModuleId).slice(0, 50);
      this.systemLogMediator.moduleNotFound(this, modIdStr);
      return false;
    }

    this.startTransaction();
    try {
      targetMeta[prop].splice(index, 1);
      if (!this.includesInSomeModule(inputModuleId, 'root')) {
        if (inputMeta.id) {
          this.mapId.delete(inputMeta.id);
        }
        this.map.delete(inputMeta.modRefId);
      }
      this.systemLogMediator.moduleSuccessfulRemoved(this, inputMeta.name, targetMeta.name);
      return true;
    } catch (err) {
      this.rollback(err as Error);
    }
  }

  protected startTransaction() {
    if (this.oldMapId.has('root')) {
      // Transaction already started.
      return false;
    }

    this.map.forEach((baseMeta, key) => this.oldMap.set(key, this.copyBaseMeta(baseMeta)));
    this.oldMapId = new Map(this.mapId);

    return true;
  }

  rollback(err?: Error) {
    if (!this.oldMapId.size) {
      throw new Error('It is forbidden for rollback() to an empty state.');
    }
    this.mapId = this.oldMapId;
    this.map = this.oldMap;
    this.commit();
    if (err) {
      throw err;
    }
  }

  commit() {
    this.oldMapId = new Map();
    this.oldMap = new Map();
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
        throw new Error(`${moduleId} not found in ModuleManager.`);
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
        throw new Error(`${moduleId} not found in ModuleManager.`);
      }
    } else {
      return this.injectorPerModMap.get(moduleId)!;
    }
  }

  /**
   * Here "raw" means that it returns "raw" normalized metadata (without `this.copyMeta()`).
   */
  protected scanRawModule(modRefId: ModRefId, allInitHooks?: AllInitHooks) {
    allInitHooks ??= new Map();
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
      this.scanRawModule(input, baseMeta.allInitHooks);
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
    this.map.set(modRefId, baseMeta);
    baseMeta.allInitHooks.forEach((initHooks, decorator) => allInitHooks.set(decorator, initHooks));
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

  protected copyBaseMeta<T extends AnyObj = AnyObj, A extends AnyObj = AnyObj>(baseMeta: BaseMeta) {
    baseMeta = { ...(baseMeta || ({} as BaseMeta)) };
    objectKeys(baseMeta).forEach((p) => {
      if (Array.isArray(baseMeta[p])) {
        (baseMeta as any)[p] = baseMeta[p].slice();
      }
    });
    return baseMeta;
  }

  /**
   * Returns normalized metadata, but without `this.copyMeta()`.
   */
  protected getOriginMetadata<T extends AnyObj = AnyObj, A extends AnyObj = AnyObj>(
    moduleId: ModuleId,
    throwErrIfNotFound?: boolean,
  ): BaseMeta | undefined;
  protected getOriginMetadata<T extends AnyObj = AnyObj, A extends AnyObj = AnyObj>(
    moduleId: ModuleId,
    throwErrIfNotFound: true,
  ): BaseMeta;
  protected getOriginMetadata<T extends AnyObj = AnyObj, A extends AnyObj = AnyObj>(
    moduleId: ModuleId,
    throwErrIfNotFound?: boolean,
  ) {
    let baseMeta: BaseMeta | undefined;
    if (typeof moduleId == 'string') {
      const mapId = this.mapId.get(moduleId);
      if (mapId) {
        baseMeta = this.map.get(mapId) as BaseMeta;
      }
    } else {
      baseMeta = this.map.get(moduleId) as BaseMeta;
    }

    if (throwErrIfNotFound && !baseMeta) {
      let moduleName: string;
      if (typeof moduleId == 'string') {
        moduleName = moduleId;
      } else {
        moduleName = getDebugClassName(moduleId) || 'unknown';
      }
      throw new Error(`${moduleName} not found in ModuleManager.`);
    }

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
    const targetMeta = this.getOriginMetadata(targetModuleId);
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
      throw new CustomError({ msg1: `Normalization of ${path} failed`, level: 'fatal' }, err);
    }
  }
}
