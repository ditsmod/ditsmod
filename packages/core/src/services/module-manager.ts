import { Injectable, resolveForwardRef } from '@ts-stack/di';
import { format } from 'util';

import { defaultProvidersPerMod } from '../constans';
import { NormalizedModuleMetadata } from '../models/normalized-module-metadata';
import { AnyObj, ModuleType, ModuleWithParams, ServiceProvider } from '../types/mix';
import { ModuleMetadata } from '../types/module-metadata';
import { ModulesMap } from '../types/modules-map';
import { checkModuleMetadata } from '../utils/check-module-metadata';
import { getModuleMetadata } from '../utils/get-module-metadata';
import { getModuleName } from '../utils/get-module-name';
import { normalizeProviders } from '../utils/ng-utils';
import { pickProperties } from '../utils/pick-properties';
import { isModuleWithParams, isProvider } from '../utils/type-guards';
import { defaultProvidersPerReq } from './default-providers-per-req';
import { Log } from './log';

type ModuleId = string | ModuleType | ModuleWithParams;

@Injectable()
export class ModuleManager {
  protected map: ModulesMap = new Map();
  protected mapId = new Map<string, ModuleType | ModuleWithParams>();
  protected oldMap: ModulesMap = new Map();
  protected oldMapId = new Map<string, ModuleType | ModuleWithParams>();

  constructor(protected log: Log) {}

  scanRootModule(appModule: ModuleType) {
    if (!getModuleMetadata(appModule, true)) {
      throw new Error(`Module build failed: module "${appModule.name}" does not have the "@RootModule()" decorator`);
    }

    const meta = this.scanRawModule(appModule);
    meta.providersPerMod.unshift(...defaultProvidersPerMod);
    meta.providersPerReq.unshift(...defaultProvidersPerReq);
    meta.exportsProvidersPerMod.unshift(...defaultProvidersPerMod);
    meta.exportsProvidersPerReq.unshift(...defaultProvidersPerReq);
    this.mapId.set('root', appModule);
    return this.copyMeta(meta);
  }

  scanModule(modOrObj: ModuleType | ModuleWithParams<any>) {
    const meta = this.scanRawModule(modOrObj);
    return this.copyMeta(meta);
  }

  getMetadata<T extends AnyObj = AnyObj, A extends AnyObj = AnyObj>(moduleId: ModuleId, throwErrOnNotFound?: boolean) {
    const meta = this.getRawMetadata<T, A>(moduleId, throwErrOnNotFound);
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
    if (targetMeta[prop].some((imp: ModuleType | ModuleWithParams) => imp === inputModule)) {
      const modIdStr = format(targetModuleId);
      this.log.moduleAlreadyImported('warn', inputModule, modIdStr);
      return false;
    }

    this.startTransaction();
    try {
      targetMeta[prop].push(inputModule as any);
      const inputMeta = this.scanRawModule(inputModule);
      this.log.successfulAddedModuleToImport('debug', inputMeta.name, targetMeta.name);
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
      this.log.moduleNotFound('warn', modIdStr);
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
      this.log.moduleNotFound('warn', modIdStr);
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
      this.log.moduleSuccessfulRemoved('debug', inputMeta.name, targetMeta.name);
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
  protected scanRawModule(modOrObj: ModuleType | ModuleWithParams<any>) {
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
      this.log.moduleHasId('debug', meta.name, meta.id);
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
    // return deepFreeze(meta);
    return meta;
  }

  /**
   * Returns normalized metadata, but without `this.copyMeta()`.
   */
  protected getRawMetadata<T extends AnyObj = AnyObj, A extends AnyObj = AnyObj>(
    moduleId: ModuleId,
    throwErrOnNotFound?: boolean
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
      oldMeta.exportsWithParams = oldMeta.exportsWithParams.slice();
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
      if (isModuleWithParams(exp)) {
        metadata.exportsWithParams.push(exp);
      } else if (isProvider(exp)) {
        this.findAndSetProvider(exp, modMetadata, metadata);
      } else {
        metadata.exportsModules.push(exp);
      }
    });

    pickProperties(metadata, modMetadata);
    metadata.extensionsMeta = { ...(metadata.extensionsMeta || {}) };

    return metadata;
  }

  protected findAndSetProvider(
    provider: ServiceProvider,
    modMetadata: ModuleMetadata,
    meta: NormalizedModuleMetadata
  ) {
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
