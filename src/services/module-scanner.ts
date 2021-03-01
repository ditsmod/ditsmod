import { reflector, resolveForwardRef, TypeProvider } from '@ts-stack/di';

import { Core } from '../core';
import { AppMetadata } from '../decorators/app-metadata';
import { ModuleWithOptions, ScanedModuleMetadata } from '../decorators/module';
import { GuardItem } from '../decorators/route';
import { ImportWithOptions, ImportWithOptions2 } from '../types/import-with-options';
import { NormalizedGuard } from '../types/router';
import { ModuleType } from '../types/types';
import { flatten } from '../utils/ng-utils';
import { isImportWithOptions, isRootModule } from '../utils/type-guards';

export class ModuleScanner extends Core {
  protected opts: AppMetadata;

  scanRootModule(appModule: ModuleType) {
    const modMetadata = reflector.annotations(appModule).find(isRootModule);
    if (!modMetadata) {
      throw new Error(`Module build failed: module "${appModule.name}" does not have the "@RootModule()" decorator`);
    }

    const mod = this.getModule(appModule);
    return this.normalizeMetadata(mod);
  }

  /**
   * Collects and normalizes module metadata.
   */
  protected normalizeMetadata(mod: ModuleType | ModuleWithOptions<any>) {
    const modMetadata = this.getRawModuleMetadata(mod);
    const modName = this.getModuleName(mod);
    this.checkModuleMetadata(modMetadata, modName);

    /**
     * Setting initial properties of metadata.
     */
    const metadata = new ScanedModuleMetadata();
    /**
     * `ngMetadataName` is used only internally and is hidden from the public API.
     */
    (metadata as any).ngMetadataName = (modMetadata as any).ngMetadataName;

    type FlattenedImports = TypeProvider | ModuleWithOptions<any> | ImportWithOptions;
    metadata.imports = flatten<FlattenedImports>(modMetadata.imports).map<ImportWithOptions2>((imp) => {
      if (isImportWithOptions(imp)) {
        return {
          prefix: imp.prefix || '',
          module: resolveForwardRef(imp.module),
          guards: this.normalizeGuards(imp.guards),
        };
      }
      return {
        prefix: '',
        module: resolveForwardRef(imp),
        guards: [],
      };
    });
    metadata.exports = flatten(modMetadata.exports).map(resolveForwardRef);
    metadata.providersPerApp = flatten(modMetadata.providersPerApp).map(resolveForwardRef);
    metadata.providersPerMod = flatten(modMetadata.providersPerMod).map(resolveForwardRef);
    metadata.providersPerReq = flatten(modMetadata.providersPerReq).map(resolveForwardRef);
    metadata.controllers = flatten(modMetadata.controllers).slice().map(resolveForwardRef);
    metadata.extensions = flatten(modMetadata.extensions).slice().map(resolveForwardRef);

    return metadata;
  }

  protected normalizeGuards(guards: GuardItem[]) {
    return (guards || []).map((item) => {
      if (Array.isArray(item)) {
        return { guard: item[0], params: item.slice(1) } as NormalizedGuard;
      } else {
        return { guard: item } as NormalizedGuard;
      }
    });
  }
}
