import { format } from 'util';
import { ChainError } from '@ts-stack/chain-error';

import { injectable, Injector, reflector } from '#di';
import { SystemLogMediator } from '#logger/system-log-mediator.js';
import { AnyObj, ModuleType, ModRefId } from '#types/mix.js';
import { ModuleWithParams } from '#types/module-metadata.js';
import { NormalizedMeta } from '#types/normalized-meta.js';
import { isModuleWithParams, isRootModule } from '#utils/type-guards.js';
import { clearDebugClassNames, getDebugClassName } from '#utils/get-debug-class-name.js';
import { objectKeys } from '#utils/object-keys.js';
import { ModuleNormalizer } from '#init/module-normalizer.js';

export type ModulesMap = Map<ModRefId, NormalizedMeta>;
export type ModulesMapId = Map<string, ModRefId>;
type ModuleId = string | ModRefId;

/**
 * Scans modules, normalizes, stores and checks their metadata for correctness,
 * adds and removes imports of one module into another.
 */
@injectable()
export class ModuleManager {
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
   * Creates a snapshot of `NormalizedMeta` for the root module, stores locally and returns it.
   * You can also get the result this way: `moduleManager.getMetadata('root')`.
   */
  scanRootModule(appModule: ModuleType) {
    if (!reflector.getDecorators(appModule, isRootModule)) {
      throw new Error(`Module scaning failed: "${appModule.name}" does not have the "@rootModule()" decorator`);
    }

    const meta = this.scanRawModule(appModule);
    this.injectorPerModMap.clear();
    this.unfinishedScanModules.clear();
    this.scanedModules.clear();
    clearDebugClassNames();
    this.mapId.set('root', appModule);
    return this.copyMeta(meta);
  }

  /**
   * Returns a snapshot of `NormalizedMeta` for a module.
   */
  scanModule(modOrObj: ModuleType | ModuleWithParams) {
    const meta = this.scanRawModule(modOrObj);
    return this.copyMeta(meta);
  }

  /**
   * Returns a snapshot of `NormalizedMeta` for given module or module ID.
   * If this snapshot is later mutated outside of `ModuleManager`, it does not affect
   * the new snapshot that later returns this method.
   */
  getMetadata<T extends AnyObj = AnyObj, A extends AnyObj = AnyObj>(
    moduleId: ModuleId,
    throwErrIfNotFound?: false,
  ): NormalizedMeta | undefined;
  getMetadata<T extends AnyObj = AnyObj, A extends AnyObj = AnyObj>(
    moduleId: ModuleId,
    throwErrIfNotFound: true,
  ): NormalizedMeta;
  getMetadata<T extends AnyObj = AnyObj, A extends AnyObj = AnyObj>(moduleId: ModuleId, throwErrIfNotFound?: boolean) {
    const meta = this.getOriginMetadata<T, A>(moduleId, throwErrIfNotFound);
    if (meta) {
      return this.copyMeta(meta);
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
      const modIdStr = format(targetModuleId);
      const msg = `Failed adding ${modName} to imports: target module with ID "${modIdStr}" not found.`;
      throw new Error(msg);
    }

    const prop = isModuleWithParams(inputModule) ? 'importsWithParams' : 'importsModules';
    if (targetMeta[prop].some((imp: ModRefId) => imp === inputModule)) {
      const modIdStr = format(targetModuleId);
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
      const modIdStr = format(inputModuleId);
      this.systemLogMediator.moduleNotFound(this, modIdStr);
      return false;
    }

    const targetMeta = this.getOriginMetadata(targetModuleId);
    if (!targetMeta) {
      const modIdStr = format(targetModuleId);
      const msg = `Failed removing ${inputMeta.name} from "imports" array: target module with ID "${modIdStr}" not found.`;
      throw new Error(msg);
    }
    const prop = isModuleWithParams(inputMeta.modRefId) ? 'importsWithParams' : 'importsModules';
    const index = targetMeta[prop].findIndex((imp: ModRefId) => imp === inputMeta.modRefId);
    if (index == -1) {
      const modIdStr = format(inputModuleId);
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

    this.map.forEach((meta, key) => this.oldMap.set(key, this.copyMeta(meta)));
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
  protected scanRawModule(modRefId: ModRefId) {
    const meta = this.normalizeMetadata(modRefId);
    const importsOrExports: (ModuleWithParams | ModuleType)[] = [];
    meta.aDecoratorMeta.forEach(({ decorator, value }) => {
      if (value.addModulesToScan) {
        const meta2 = meta.normDecorMeta.get(decorator);
        if (meta2) {
          importsOrExports.push(...value.addModulesToScan(meta2));
        }
      }
    });

    // Merging arrays with this props in one array.
    const inputs = this.propsWithModules
      .map((p) => meta[p])
      .reduce<ModRefId[]>((prev, curr) => prev.concat(curr), importsOrExports);

    for (const input of inputs) {
      if (this.unfinishedScanModules.has(input) || this.scanedModules.has(input)) {
        continue;
      }
      this.unfinishedScanModules.add(input);
      this.scanRawModule(input);
      this.unfinishedScanModules.delete(input);
      this.scanedModules.add(input);
    }

    if (meta.id) {
      this.mapId.set(meta.id, modRefId);
      this.systemLogMediator.moduleHasId(this, meta.id);
    }
    this.map.set(modRefId, meta);
    return meta;
  }

  protected copyMeta<T extends AnyObj = AnyObj, A extends AnyObj = AnyObj>(meta: NormalizedMeta) {
    meta = { ...(meta || ({} as NormalizedMeta)) };
    objectKeys(meta).forEach((p) => {
      if (Array.isArray(meta[p])) {
        (meta as any)[p] = meta[p].slice();
      }
    });
    return meta;
  }

  /**
   * Returns normalized metadata, but without `this.copyMeta()`.
   */
  protected getOriginMetadata<T extends AnyObj = AnyObj, A extends AnyObj = AnyObj>(
    moduleId: ModuleId,
    throwErrIfNotFound?: boolean,
  ): NormalizedMeta | undefined;
  protected getOriginMetadata<T extends AnyObj = AnyObj, A extends AnyObj = AnyObj>(
    moduleId: ModuleId,
    throwErrIfNotFound: true,
  ): NormalizedMeta;
  protected getOriginMetadata<T extends AnyObj = AnyObj, A extends AnyObj = AnyObj>(
    moduleId: ModuleId,
    throwErrIfNotFound?: boolean,
  ) {
    let meta: NormalizedMeta | undefined;
    if (typeof moduleId == 'string') {
      const mapId = this.mapId.get(moduleId);
      if (mapId) {
        meta = this.map.get(mapId) as NormalizedMeta;
      }
    } else {
      meta = this.map.get(moduleId) as NormalizedMeta;
    }

    if (throwErrIfNotFound && !meta) {
      let moduleName: string;
      if (typeof moduleId == 'string') {
        moduleName = moduleId;
      } else {
        moduleName = getDebugClassName(moduleId);
      }
      throw new Error(`${moduleName} not found in ModuleManager.`);
    }

    return meta;
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

  protected normalizeMetadata(modRefId: ModRefId): NormalizedMeta {
    try {
      return this.moduleNormalizer.normalize(modRefId);
    } catch (err: any) {
      const moduleName = getDebugClassName(modRefId);
      let path = [...this.unfinishedScanModules].map((id) => getDebugClassName(id)).join(' -> ');
      path = this.unfinishedScanModules.size > 1 ? `${moduleName} (${path})` : `${moduleName}`;
      throw new ChainError(`Normalization of ${path} failed`, err);
    }
  }
}
