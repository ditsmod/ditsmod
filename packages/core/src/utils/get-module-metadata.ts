import { reflector } from '@ts-stack/di';

import { Module } from '../decorators/module';
import { ModuleMetadata } from '../types/module-metadata';
import { ModuleType, ModuleWithParams } from '../types/mix';
import { checkModuleMetadata } from './check-module-metadata';
import { getModuleName } from './get-module-name';
import { mergeArrays } from './merge-arrays-options';
import { isForwardRef, isModule, isModuleWithParams, isRootModule } from './type-guards';

export function getModuleMetadata<T extends ModuleMetadata>(
  modOrObj: ModuleType | ModuleWithParams,
  isRoot?: boolean
): ModuleMetadata {
  const typeGuard = isRoot ? isRootModule : (m: ModuleMetadata) => isModule(m) || isRootModule(m);

  if (isForwardRef(modOrObj)) {
    modOrObj = modOrObj();
  }

  if (isModuleWithParams(modOrObj)) {
    const modWitParams = modOrObj;
    const modMetadata: T = reflector.annotations(modWitParams.module).find(typeGuard) as T;
    const modName = getModuleName(modWitParams.module);
    checkModuleMetadata(modMetadata, modName);

    if (modMetadata.id) {
      const msg =
        `${modName} must not have an "id" in the metadata of the decorator @Module. ` +
        'Instead, you can specify the "id" in the object that contains the module parameters.';
      throw new Error(msg);
    }
    const metadata = new Module(modMetadata);
    metadata.id = modWitParams.id;
    metadata.providersPerApp = mergeArrays(modMetadata.providersPerApp, modWitParams.providersPerApp);
    metadata.providersPerMod = mergeArrays(modMetadata.providersPerMod, modWitParams.providersPerMod);
    metadata.providersPerReq = mergeArrays(modMetadata.providersPerReq, modWitParams.providersPerReq);
    return metadata;
  } else {
    return reflector.annotations(modOrObj).find(typeGuard);
  }
}
