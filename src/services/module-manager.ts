import { format } from 'util';
import { Injectable, resolveForwardRef } from '@ts-stack/di';

import { ModuleType } from '../types/module-type';
import { ModuleWithParams } from '../types/module-with-params';
import { checkModuleMetadata } from '../utils/check-module-metadata';
import { getModuleName } from '../utils/get-module-name';
import { getModuleMetadata } from '../utils/get-module-metadata';
import { isModuleWithParams, isProvider } from '../utils/type-guards';
import { NormalizedModuleMetadata } from '../models/normalized-module-metadata';
import { Logger } from '../types/logger';
import { ModulesMap } from '../types/modules-map';
import { AnyObj } from '../types/any-obj';
import { pickProperties } from '../utils/pick-properties';

type ModuleId = string | ModuleType | ModuleWithParams;

@Injectable()
export class ModuleManager {
  protected map: ModulesMap = new WeakMap();
  protected mapId = new Map<string, ModuleType | ModuleWithParams>();

  constructor(protected log: Logger) {}

  scanRootModule(appModule: ModuleType) {
    if (!getModuleMetadata(appModule, true)) {
      throw new Error(`Module build failed: module "${appModule.name}" does not have the "@RootModule()" decorator`);
    }
    this.scanModule(appModule);
    return this.mapId.set('root', appModule);
  }

  scanModule(modOrObj: ModuleType | ModuleWithParams<any>) {
    if (!Object.isFrozen(modOrObj)) {
      Object.freeze(modOrObj);
    }

    const meta = this.normalizeMetadata(modOrObj);
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

  getMaps() {
    return { map: this.map, mapId: this.mapId };
  }

  getMetadata<T extends AnyObj = AnyObj>(moduleId: ModuleId) {
    if (typeof moduleId == 'string') {
      const mapId = this.mapId.get(moduleId);
      return this.map.get(mapId) as NormalizedModuleMetadata<T>;
    } else {
      return this.map.get(moduleId) as NormalizedModuleMetadata<T>;
    }
  }

  /**
   * If `inputModule` added, returns `true`, otherwise - returns `false`.
   *
   * @param inputModule Module to be added.
   * @param targetModuleId Module ID to which the input module will be added.
   */
  addImport(inputModule: ModuleType | ModuleWithParams, targetModuleId: ModuleId = 'root'): boolean {
    const target = this.getMetadata(targetModuleId);
    if (!target) {
      const modName = getModuleName(inputModule);
      const msg = `Failed adding ${modName} to imports: target module with ID "${targetModuleId}" not found.`;
      throw new Error(msg);
    }

    const prop = isModuleWithParams(inputModule) ? 'importsWithParams' : 'importsModules';
    if (target[prop].some((imp: ModuleType | ModuleWithParams) => imp === inputModule)) {
      const msg = `The module with ID "${format(inputModule)}" has already been imported into "${format(
        targetModuleId
      )}"`;
      this.log.warn(msg);
      return false;
    } else {
      target[prop].push(inputModule as any);
    }
    this.scanModule(inputModule);
    return true;
  }

  /**
   * @param targetModuleId Module ID from where the input module will be removed.
   */
  removeImport(inputModuleId: ModuleId, targetModuleId: ModuleId = 'root'): boolean {
    const meta = this.getMetadata(inputModuleId);
    const warn = `Module with ID "${format(inputModuleId)}" not found`;
    if (!meta) {
      this.log.warn(warn);
      return false;
    }

    const target = this.getMetadata(targetModuleId);
    if (!target) {
      const msg = `Failed removing ${meta.name} from "imports" array: target module with ID "${targetModuleId}" not found.`;
      throw new Error(msg);
    }
    const prop = isModuleWithParams(meta.module) ? 'importsWithParams' : 'importsModules';
    const index = target[prop].findIndex((imp: ModuleType | ModuleWithParams) => imp === meta.module);
    if (index == -1) {
      this.log.warn(warn);
      return false;
    }
    target[prop].splice(index, 1);
    const rootModule = this.getMetadata('root').module;
    if (!this.includesInSomeModule(inputModuleId, rootModule)) {
      if (meta.id) {
        this.mapId.delete(meta.id);
      }
      this.map.delete(meta.module);
    }
    return true;
  }

  /**
   * Recursively searches for input module.
   * Returns true if input module includes in imports/exports of target module.
   *
   * @param inputModuleId The module you need to find.
   * @param targetModuleId Module where to search `inputModule`.
   */
  protected includesInSomeModule(inputModuleId: ModuleId, targetModuleId: ModuleId): boolean {
    const meta = this.getMetadata(targetModuleId);
    const importsOrExports = [...meta.importsModules, ...meta.importsWithParams, ...meta.exportsModules];

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

  protected normalizeArray(arr: any[]) {
    return (arr || []).slice().map(resolveForwardRef);
  }
}
