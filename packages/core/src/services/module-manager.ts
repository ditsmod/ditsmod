import { Injectable, resolveForwardRef } from '@ts-stack/di';
import { format } from 'util';

import { NormalizedModuleMetadata } from '../models/normalized-module-metadata';
import { AnyObj, ModuleType, ModuleWithParams, ServiceProvider } from '../types/mix';
import { ModuleMetadata } from '../types/module-metadata';
import { getModuleMetadata } from '../utils/get-module-metadata';
import { getModuleName } from '../utils/get-module-name';
import { normalizeProviders } from '../utils/ng-utils';
import { pickProperties } from '../utils/pick-properties';
import { isModuleWithParams, isProvider } from '../utils/type-guards';
import { Log } from './log';

export type ModulesMap = Map<ModuleType | ModuleWithParams, NormalizedModuleMetadata>;
export type ModulesMapId = Map<string, ModuleType | ModuleWithParams>;
/**
 * Don't use this for public API (worse readable).
 */
type AnyModule = ModuleType | ModuleWithParams;
type ModuleId = string | ModuleType | ModuleWithParams;

@Injectable()
export class ModuleManager {
  protected map: ModulesMap = new Map();
  protected mapId = new Map<string, AnyModule>();
  protected oldMap: ModulesMap = new Map();
  protected oldMapId = new Map<string, AnyModule>();

  constructor(protected log: Log) {}

  /**
   * Returns a snapshot of NormalizedModuleMetadata for the root module.
   */
  scanRootModule(appModule: ModuleType) {
    if (!getModuleMetadata(appModule, true)) {
      throw new Error(`Module build failed: module "${appModule.name}" does not have the "@RootModule()" decorator`);
    }

    const meta = this.scanRawModule(appModule);
    this.mapId.set('root', appModule);
    return this.copyMeta(meta);
  }

  /**
   * Returns a snapshot of NormalizedModuleMetadata for a module.
   */
  scanModule(modOrObj: ModuleType | ModuleWithParams) {
    const meta = this.scanRawModule(modOrObj);
    return this.copyMeta(meta);
  }

  /**
   * Returns a snapshot of NormalizedModuleMetadata for given module or module ID.
   */
  getMetadata<T extends AnyObj = AnyObj, A extends AnyObj = AnyObj>(moduleId: ModuleId, throwErrIfNotFound?: boolean) {
    const meta = this.getRawMetadata<T, A>(moduleId, throwErrIfNotFound);
    return this.copyMeta(meta!);
  }

  /**
   * If `inputModule` added, returns `true`, otherwise - returns `false`.
   *
   * @param inputModule Module to be added.
   * @param targetModuleId Module ID to which the input module will be added.
   */
  addImport(inputModule: ModuleType | ModuleWithParams, targetModuleId: ModuleId = 'root'): boolean | void {
    const targetMeta = this.getRawMetadata(targetModuleId);
    if (!targetMeta) {
      const modName = getModuleName(inputModule);
      const modIdStr = format(targetModuleId);
      const msg = `Failed adding ${modName} to imports: target module with ID "${modIdStr}" not found.`;
      throw new Error(msg);
    }

    const prop = isModuleWithParams(inputModule) ? 'importsWithParams' : 'importsModules';
    if (targetMeta[prop].some((imp: AnyModule) => imp === inputModule)) {
      const modIdStr = format(targetModuleId);
      this.log.moduleAlreadyImported('warn', { className: this.constructor.name }, inputModule, modIdStr);
      return false;
    }

    this.startTransaction();
    try {
      (targetMeta[prop] as AnyModule[]).push(inputModule);
      this.scanRawModule(inputModule);
      this.log.successfulAddedModuleToImport('debug', { className: this.constructor.name }, targetMeta.name);
      return true;
    } catch (err) {
      this.rollback(err as Error);
    }
  }

  /**
   * @param targetModuleId Module ID from where the input module will be removed.
   */
  removeImport(inputModuleId: ModuleId, targetModuleId: ModuleId = 'root'): boolean | void {
    const inputMeta = this.getRawMetadata(inputModuleId);
    if (!inputMeta) {
      const modIdStr = format(inputModuleId);
      this.log.moduleNotFound('warn', { className: this.constructor.name }, modIdStr);
      return false;
    }

    const targetMeta = this.getRawMetadata(targetModuleId);
    if (!targetMeta) {
      const modIdStr = format(targetModuleId);
      const msg = `Failed removing ${inputMeta.name} from "imports" array: target module with ID "${modIdStr}" not found.`;
      throw new Error(msg);
    }
    const prop = isModuleWithParams(inputMeta.module) ? 'importsWithParams' : 'importsModules';
    const index = targetMeta[prop].findIndex((imp: AnyModule) => imp === inputMeta.module);
    if (index == -1) {
      const modIdStr = format(inputModuleId);
      this.log.moduleNotFound('warn', { className: this.constructor.name }, modIdStr);
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
      this.log.moduleSuccessfulRemoved('debug', { className: this.constructor.name }, inputMeta.name, targetMeta.name);
      return true;
    } catch (err) {
      this.rollback(err as Error);
    }
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

  /**
   * Here "raw" means that it returns "raw" normalized metadata (without `this.copyMeta()`).
   */
  protected scanRawModule(modOrObj: AnyModule) {
    const meta = this.normalizeMetadata(modOrObj);

    const importsOrExports = [
      ...meta.importsModules,
      ...meta.importsWithParams,
      ...meta.exportsModules,
      ...meta.exportsWithParams,
    ];

    importsOrExports.forEach((impOrExp) => {
      this.scanRawModule(impOrExp);
    });

    if (meta.id) {
      this.mapId.set(meta.id, modOrObj);
      this.log.moduleHasId('debug', { className: this.constructor.name }, meta.name, meta.id);
    }
    this.map.set(modOrObj, meta);
    return meta;
  }

  /**
   * @todo Refactor this method to use `deepFreeze()`.
   */
  protected copyMeta<T extends AnyObj = AnyObj, A extends AnyObj = AnyObj>(meta: NormalizedModuleMetadata<T, A>) {
    meta = { ...(meta || ({} as NormalizedModuleMetadata<T, A>)) };
    meta.importsModules = meta.importsModules.slice();
    meta.importsWithParams = meta.importsWithParams.slice();
    meta.controllers = meta.controllers.slice();
    meta.extensions = meta.extensions.slice();
    meta.exportsModules = meta.exportsModules.slice();
    meta.exportsWithParams = meta.exportsWithParams.slice();
    meta.exportsProvidersPerMod = meta.exportsProvidersPerMod.slice();
    meta.exportsProvidersPerRou = meta.exportsProvidersPerRou.slice();
    meta.exportsProvidersPerReq = meta.exportsProvidersPerReq.slice();
    meta.providersPerApp = meta.providersPerApp.slice();
    meta.providersPerMod = meta.providersPerMod.slice();
    meta.providersPerRou = meta.providersPerRou.slice();
    meta.providersPerReq = meta.providersPerReq.slice();
    // return deepFreeze(meta);
    return meta;
  }

  /**
   * Returns normalized metadata, but without `this.copyMeta()`.
   */
  protected getRawMetadata<T extends AnyObj = AnyObj, A extends AnyObj = AnyObj>(
    moduleId: ModuleId,
    throwErrIfNotFound?: boolean
  ) {
    let meta: NormalizedModuleMetadata<T, A> | undefined;
    if (typeof moduleId == 'string') {
      const mapId = this.mapId.get(moduleId);
      if (mapId) {
        meta = this.map.get(mapId) as NormalizedModuleMetadata<T, A>;
      }
    } else {
      meta = this.map.get(moduleId) as NormalizedModuleMetadata<T, A>;
    }

    if (throwErrIfNotFound && !meta) {
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

  protected startTransaction() {
    if (this.oldMapId.has('root')) {
      // Transaction already started.
      return false;
    }

    this.map.forEach((meta, key) => {
      const oldMeta = { ...meta };
      oldMeta.importsModules = oldMeta.importsModules.slice();
      oldMeta.importsWithParams = oldMeta.importsWithParams.slice();
      oldMeta.exportsModules = oldMeta.exportsModules.slice();
      oldMeta.exportsWithParams = oldMeta.exportsWithParams.slice();
      this.oldMap.set(key, oldMeta);
    });
    this.oldMapId = new Map(this.mapId);

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
    const targetMeta = this.getRawMetadata(targetModuleId);
    const importsOrExports: (ModuleType<AnyObj> | ModuleWithParams<AnyObj>)[] = [];

    if (targetMeta) {
      importsOrExports.push(
        ...targetMeta.importsModules,
        ...targetMeta.importsWithParams,
        ...targetMeta.exportsModules,
        ...targetMeta.exportsWithParams
      );
    }

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
   * Returns normalized module metadata.
   */
  protected normalizeMetadata(mod: AnyModule) {
    const rawMeta = getModuleMetadata(mod);
    const modName = getModuleName(mod);
    if (!rawMeta) {
      throw new Error(`Module build failed: module "${modName}" does not have the "@Module()" decorator`);
    }

    /**
     * Setting initial properties of metadata.
     */
    const meta = new NormalizedModuleMetadata();
    meta.name = modName;
    meta.module = mod;
    /**
     * `ngMetadataName` is used only internally and is hidden from the public API.
     */
    meta.ngMetadataName = (rawMeta as any).ngMetadataName;

    rawMeta.imports?.forEach((imp) => {
      imp = resolveForwardRef(imp);
      if (isModuleWithParams(imp)) {
        meta.importsWithParams.push(imp);
      } else {
        meta.importsModules.push(imp);
      }
    });

    rawMeta.exports?.forEach((exp) => {
      exp = resolveForwardRef(exp);
      if (isModuleWithParams(exp)) {
        meta.exportsWithParams.push(exp);
      } else if (isProvider(exp)) {
        this.findAndSetProvider(exp, rawMeta, meta);
      } else {
        meta.exportsModules.push(exp);
      }
    });

    pickProperties(meta, rawMeta);
    meta.extensionsMeta = { ...(meta.extensionsMeta || {}) };

    return meta;
  }

  protected findAndSetProvider(provider: ServiceProvider, modMetadata: ModuleMetadata, meta: NormalizedModuleMetadata) {
    const token = normalizeProviders([provider])[0].provide;
    const { providersPerMod, providersPerRou, providersPerReq } = modMetadata;
    const { name, exportsProvidersPerMod, exportsProvidersPerRou, exportsProvidersPerReq } = meta;

    if (hasProviderIn(providersPerMod)) {
      exportsProvidersPerMod.push(provider);
      return true;
    } else if (hasProviderIn(providersPerRou)) {
      exportsProvidersPerRou.push(provider);
      return true;
    } else if (hasProviderIn(providersPerReq)) {
      exportsProvidersPerReq.push(provider);
      return true;
    }

    const providerName = token.name || token;
    throw new Error(
      `Importing ${providerName} from ${name} ` +
        'should includes in "providersPerMod" or "providersPerRou", or "providersPerReq", ' +
        'or in some "exports" of imported modules. ' +
        'Tip: "providersPerApp" no need exports, they are automatically exported.'
    );

    function hasProviderIn(providers: ServiceProvider[] | undefined) {
      if (!providers) {
        return;
      }
      const normProviders = normalizeProviders(providers);
      return normProviders.some((p) => p.provide === token);
    }
  }
}
