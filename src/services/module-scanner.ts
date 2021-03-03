import { resolveForwardRef } from '@ts-stack/di';

import { GuardItem } from '../types/guard-item';
import { ModuleType } from '../types/module-type';
import { ModuleWithParams } from '../types/module-with-params';
import { NormalizedGuard } from '../types/normalized-guard';
import { checkModuleMetadata } from '../utils/check-module-metadata';
import { getModuleName } from '../utils/get-module-name';
import { getModuleMetadata } from '../utils/get-module-metadata';
import { isModuleWithParams, isProvider } from '../utils/type-guards';
import { NormalizedModuleMetadata } from '../models/normalized-module-metadata';
import { NormalizedImport } from '../types/normalized-import';
import { getModule } from '../utils/get-module';
import { ModuleMetadata } from '../types/module-metadata';

export class ModuleScanner {
  protected map = new Map<ModuleType, NormalizedModuleMetadata>();

  scanModule(modOrObj: ModuleType | ModuleWithParams<any>) {
    const metadata = this.normalizeMetadata(modOrObj);
    this.map.set(getModule(modOrObj), metadata);

    metadata.imports?.forEach((imp) => {
      this.scanModule(imp.module);
    });
  }

  /**
   * Freezes original module metadata and returns normalized module metadata.
   */
  protected normalizeMetadata(mod: ModuleType | ModuleWithParams<any>) {
    if (!Object.isFrozen(mod)) {
      Object.freeze(mod);
    }
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
    metadata.ngMetadataName = (modMetadata as any).ngMetadataName;

    metadata.imports = (modMetadata.imports || []).map<NormalizedImport<any>>((imp) => {
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

    modMetadata.exports?.forEach((exp) => {
      if (isModuleWithParams(exp)) {
        metadata.modulesWithParamsExports.push(exp);
      } else if (isProvider(exp)) {
        metadata.providersExports.push(exp);
      } else {
        metadata.modulesExports.push(exp);
      }
    });

    const group1: (keyof NormalizedModuleMetadata)[] = [
      'imports',
      'modulesWithParamsExports',
      'providersExports',
      'modulesExports',
    ];
    group1.forEach((prop) => {
      if (!metadata[prop]?.length) {
        delete metadata[prop];
      }
    });

    const group2: Exclude<keyof ModuleMetadata, 'exports'>[] = [
      'controllers',
      'providersPerApp',
      'providersPerMod',
      'providersPerReq',
      'extensions',
    ];

    group2.forEach((prop) => {
      if (modMetadata[prop]?.length) {
        metadata[prop] = this.normalizeArray(modMetadata[prop]);
      } else {
        delete metadata[prop];
      }
    });

    return metadata;
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
