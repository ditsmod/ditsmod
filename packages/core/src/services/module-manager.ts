import { Injectable, resolveForwardRef } from '@ts-stack/di';
import { format } from 'util';

import { NormalizedModuleMetadata } from '../models/normalized-module-metadata';
import { AnyObj, ModuleType, ModuleWithParams } from '../types/mix';
import { Logger } from '../types/logger';
import { ModulesMap } from '../types/modules-map';
import { checkModuleMetadata } from '../utils/check-module-metadata';
import { getModuleMetadata } from '../utils/get-module-metadata';
import { getModuleName } from '../utils/get-module-name';
import { pickProperties } from '../utils/pick-properties';
import { isModuleWithParams, isProvider } from '../utils/type-guards';

type ModuleId = string | ModuleType | ModuleWithParams;

@Injectable()
export class ModuleManager {
  protected map: ModulesMap = new Map();
  protected mapId = new Map<string, ModuleType | ModuleWithParams>();
  protected oldMap: ModulesMap = new Map();
  protected oldMapId = new Map<string, ModuleType | ModuleWithParams>();

  constructor(protected log: Logger) {}

  scanRootModule(appModule: ModuleType) {
    if (!getModuleMetadata(appModule, true)) {
      throw new Error(`Module build failed: module "${appModule.name}" does not have the "@RootModule()" decorator`);
    }

    const meta = this.scanModule(appModule);
    this.mapId.set('root', appModule);
    return meta;
  }

  scanModule(modOrObj: ModuleType | ModuleWithParams<any>) {
    if (!Object.isFrozen(modOrObj)) {
      Object.freeze(modOrObj);
    }

    const meta = this.normalizeMetadata(modOrObj);
    Object.freeze(meta);

    [...meta.importsModules, ...meta.importsWithParams, ...meta.exportsModules].forEach((impOrExp) => {
      this.scanModule(impOrExp);
    });

    if (meta.id) {
      this.mapId.set(meta.id, modOrObj);
      this.log.debug(`${meta.name} has ID: "${meta.id}".`);
    }
    this.map.set(modOrObj, meta);
    return meta;
  }

  getMetadata<T extends AnyObj = AnyObj>(moduleId: ModuleId, throwErrOnNotFound?: boolean) {
    const meta = this.getRawMetadata<T>(moduleId, throwErrOnNotFound);
    return { ...meta };
  }

  protected getRawMetadata<T extends AnyObj = AnyObj>(moduleId: ModuleId, throwErrOnNotFound?: boolean) {
    let meta: NormalizedModuleMetadata<T>;
    if (typeof moduleId == 'string') {
      const mapId = this.mapId.get(moduleId);
      meta = this.map.get(mapId) as NormalizedModuleMetadata<T>;
    } else {
      meta = this.map.get(moduleId) as NormalizedModuleMetadata<T>;
    }

    if (throwErrOnNotFound && !meta) {
      let moduleName: string;
      if (typeof moduleId == 'string') {
        moduleName = moduleId;
      } else {
        moduleName = getModuleName(moduleId);
      }
      throw new Error(`${moduleName} not found in ModuleManager.`);
    }

    return meta;
  }

  /**
   * If `inputModule` added, returns `true`, otherwise - returns `false`.
   *
   * @param inputModule Module to be added.
   * @param targetModuleId Module ID to which the input module will be added.
   */
  addImport(inputModule: ModuleType | ModuleWithParams, targetModuleId: ModuleId = 'root'): boolean {
    const targetMeta = this.getRawMetadata(targetModuleId);
    if (!targetMeta) {
      const modName = getModuleName(inputModule);
      const modIdStr = format(targetModuleId);
      const msg = `Failed adding ${modName} to imports: target module with ID "${modIdStr}" not found.`;
      throw new Error(msg);
    }

    const prop = isModuleWithParams(inputModule) ? 'importsWithParams' : 'importsModules';
    if (targetMeta[prop].some((imp: ModuleType | ModuleWithParams) => imp === inputModule)) {
      const modIdStr = format(targetModuleId);
      const msg = `The module with ID "${format(inputModule)}" has already been imported into "${modIdStr}"`;
      this.log.warn(msg);
      return false;
    }

    this.startTransaction();
    try {
      targetMeta[prop].push(inputModule as any);
      const inputMeta = this.scanModule(inputModule);
      this.log.debug(`Successful added ${inputMeta.name} to ${targetMeta.name}`);
      return true;
    } catch (err) {
      this.rollback(err);
    }
  }

  /**
   * @param targetModuleId Module ID from where the input module will be removed.
   */
  removeImport(inputModuleId: ModuleId, targetModuleId: ModuleId = 'root'): boolean {
    const inputMeta = this.getRawMetadata(inputModuleId);
    if (!inputMeta) {
      const modIdStr = format(inputModuleId);
      this.log.warn(`Module with ID "${modIdStr}" not found`);
      return false;
    }

    const targetMeta = this.getRawMetadata(targetModuleId);
    if (!targetMeta) {
      const modIdStr = format(targetModuleId);
      const msg = `Failed removing ${inputMeta.name} from "imports" array: target module with ID "${modIdStr}" not found.`;
      throw new Error(msg);
    }
    const prop = isModuleWithParams(inputMeta.module) ? 'importsWithParams' : 'importsModules';
    const index = targetMeta[prop].findIndex((imp: ModuleType | ModuleWithParams) => imp === inputMeta.module);
    if (index == -1) {
      const modIdStr = format(inputModuleId);
      this.log.error(`Module with ID "${modIdStr}" not found`);
      return false;
    }

    this.startTransaction();
    try {
      targetMeta[prop].splice(index, 1);
      if (!this.includesInSomeModule(inputModuleId, 'root')) {
        if (inputMeta.id) {
          this.mapId.delete(inputMeta.id);
        }
        this.map.delete(inputMeta.module);
      }
      this.log.debug(`Successful removed ${inputMeta.name} from ${targetMeta.name}`);
      return true;
    } catch (err) {
      this.rollback(err);
    }
  }

  setLogger(log: Logger) {
    this.log = log;
  }

  commit() {
    this.oldMapId = new Map();
    this.oldMap = new Map();
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

  protected startTransaction() {
    if (this.oldMapId.has('root')) {
      // Transaction already started.
      return;
    }

    this.map.forEach((meta, key) => {
      const oldMeta = { ...meta };
      oldMeta.importsModules = oldMeta.importsModules.slice();
      oldMeta.importsWithParams = oldMeta.importsWithParams.slice();
      oldMeta.exportsModules = oldMeta.exportsModules.slice();
      Object.freeze(oldMeta);
      this.oldMap.set(key, oldMeta);
    });
    this.oldMapId = new Map(this.mapId);
  }

  /**
   * Recursively searches for input module.
   * Returns true if input module includes in imports/exports of target module.
   *
   * @param inputModuleId The module you need to find.
   * @param targetModuleId Module where to search `inputModule`.
   */
  protected includesInSomeModule(inputModuleId: ModuleId, targetModuleId: ModuleId): boolean {
    const targetMeta = this.getRawMetadata(targetModuleId);
    const importsOrExports = [
      ...targetMeta.importsModules,
      ...targetMeta.importsWithParams,
      ...targetMeta.exportsModules,
    ];

    return (
      importsOrExports.some((modOrObj) => {
        return inputModuleId === modOrObj;
      }) ||
      importsOrExports.some((modOrObj) => {
        return this.includesInSomeModule(inputModuleId, modOrObj);
      })
    );
  }

  /**
   * Freezes original module metadata and returns normalized module metadata.
   */
  protected normalizeMetadata(mod: ModuleType | ModuleWithParams) {
    const modMetadata = getModuleMetadata(mod);
    const modName = getModuleName(mod);
    checkModuleMetadata(modMetadata, modName);

    /**
     * Setting initial properties of metadata.
     */
    const metadata = new NormalizedModuleMetadata();
    metadata.name = modName;
    metadata.module = mod;
    /**
     * `ngMetadataName` is used only internally and is hidden from the public API.
     */
    metadata.ngMetadataName = (modMetadata as any).ngMetadataName;

    modMetadata.imports?.forEach((imp) => {
      imp = resolveForwardRef(imp);
      if (isModuleWithParams(imp)) {
        metadata.importsWithParams.push(imp);
      } else {
        metadata.importsModules.push(imp);
      }
    });

    modMetadata.exports?.forEach((exp) => {
      exp = resolveForwardRef(exp);
      if (isProvider(exp)) {
        metadata.exportsProviders.push(exp);
      } else {
        metadata.exportsModules.push(exp);
      }
    });

    pickProperties(metadata, modMetadata);

    return metadata;
  }
}
