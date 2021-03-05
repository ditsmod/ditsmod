import { Injectable, resolveForwardRef } from '@ts-stack/di';

import { ModuleType } from '../types/module-type';
import { ModuleWithParams } from '../types/module-with-params';
import { checkModuleMetadata } from '../utils/check-module-metadata';
import { getModuleName } from '../utils/get-module-name';
import { getModuleMetadata } from '../utils/get-module-metadata';
import { isModuleWithParams, isProvider } from '../utils/type-guards';
import { NormalizedModuleMetadata } from '../models/normalized-module-metadata';
import { ModuleMetadata } from '../types/module-metadata';

type MapType = Map<string | number | ModuleType | ModuleWithParams, NormalizedModuleMetadata>;

@Injectable()
export class ModuleManager {
  addImport(modOrObj: ModuleType | ModuleWithParams, target: NormalizedModuleMetadata) {
    if (isModuleWithParams(modOrObj)) {
      if (!target.importsWithParams) {
        target.importsWithParams = [];
      }
      target.importsWithParams.push(modOrObj);
    } else {
      if (!target.importsModules) {
        target.importsModules = [];
      }
      target.importsModules.push(modOrObj);
    }
  }

  scanModule(modOrObj: ModuleType | ModuleWithParams<any>, map: MapType = new Map()) {
    if (!Object.isFrozen(modOrObj)) {
      Object.freeze(modOrObj);
    }

    const metadata = this.normalizeMetadata(modOrObj);
    [...metadata.importsModules, ...metadata.importsWithParams, ...metadata.exportsModules].forEach((impOrExp) => {
      this.scanModule(impOrExp, map);
    });

    type ImpOrExp = Exclude<keyof NormalizedModuleMetadata, 'id'>;
    const group: ImpOrExp[] = ['importsModules', 'importsWithParams', 'exportsModules', 'exportsProviders'];

    group.forEach((prop) => {
      if (!metadata[prop]?.length) {
        delete metadata[prop];
      }
    });

    const id = metadata.id || modOrObj;
    return map.set(id, metadata);
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
    /**
     * `ngMetadataName` is used only internally and is hidden from the public API.
     */
    metadata.ngMetadataName = (modMetadata as any).ngMetadataName;

    if (modMetadata.id) {
      metadata.id = modMetadata.id;
    }

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

    const group: Exclude<keyof ModuleMetadata, 'id' | 'imports' | 'exports'>[] = [
      'controllers',
      'providersPerApp',
      'providersPerMod',
      'providersPerReq',
      'extensions',
    ];

    group.forEach((prop) => {
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
}
