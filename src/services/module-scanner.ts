import { reflector, resolveForwardRef } from '@ts-stack/di';

import { GuardItem } from '../types/guard-item';
import { ModuleType } from '../types/module-type';
import { ModuleWithParams } from '../types/module-with-params';
import { NormalizedGuard } from '../types/normalized-guard';
import { checkModuleMetadata } from '../utils/check-module-metadata';
import { getModuleName } from '../utils/get-module-name';
import { getModuleMetadata } from '../utils/get-module-metadata';
import { isModuleWithParams, isRootModule } from '../utils/type-guards';
import { NormalizedModuleMetadata } from '../models/normalized-module-metadata';
import { NormalizedImport } from '../types/normalized-import';

export class ModuleScanner {
  protected map = new Map<ModuleType, NormalizedModuleMetadata>();

  scanRootModule(appModule: ModuleType) {
    const modMetadata = reflector.annotations(appModule).find(isRootModule);
    if (!modMetadata) {
      throw new Error(`Module build failed: module "${appModule.name}" does not have the "@RootModule()" decorator`);
    }

    return this.normalizeMetadata(appModule);
  }

  /**
   * Collects and normalizes module metadata.
   */
  protected normalizeMetadata(mod: ModuleType | ModuleWithParams<any>) {
    const modMetadata = getModuleMetadata(mod);
    const modName = getModuleName(mod);
    checkModuleMetadata(modMetadata, modName);

    /**
     * Setting initial properties of metadata.
     */
    const metadata = new NormalizedModuleMetadata();
    /**
     * `ngMetadataName` is used only internally and is hidden from the public API.
     */
    (metadata as any).ngMetadataName = (modMetadata as any).ngMetadataName;

    metadata.imports = modMetadata.imports.map<NormalizedImport<any>>((imp) => {
      if (isModuleWithParams(imp)) {
        return Object.assign(imp, {
          prefix: imp.prefix || '',
          module: resolveForwardRef(imp.module),
          guards: this.normalizeGuards(imp.guards),
        });
      }
      return {
        prefix: '',
        module: resolveForwardRef(imp),
        guards: [],
      };
    });
    metadata.exports = this.normalizeArray(modMetadata.exports);
    metadata.providersPerApp = this.normalizeArray(modMetadata.providersPerApp);
    metadata.providersPerMod = this.normalizeArray(modMetadata.providersPerMod);
    metadata.providersPerReq = this.normalizeArray(modMetadata.providersPerReq);
    metadata.controllers = this.normalizeArray(modMetadata.controllers);
    metadata.extensions = this.normalizeArray(modMetadata.extensions);

    const module = isModuleWithParams(mod) ? mod.module : mod;
    return this.map.set(module, metadata);
  }

  protected normalizeArray(arr: any[]) {
    return (arr || []).slice().map(resolveForwardRef);
  }

  protected normalizeGuards(guards: GuardItem[]) {
    return (guards || []).slice().map((item) => {
      if (Array.isArray(item)) {
        return { guard: item[0], params: item.slice(1) } as NormalizedGuard;
      } else {
        return { guard: item } as NormalizedGuard;
      }
    });
  }
}
