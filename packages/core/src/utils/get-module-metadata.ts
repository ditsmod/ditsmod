import { Container, reflector } from '@ts-stack/di';

import { ModuleMetadata } from '../types/module-metadata';
import { AnyFn, ModuleType, ModuleWithParams } from '../types/mix';
import { getModuleName } from './get-module-name';
import { mergeArrays } from './merge-arrays';
import { isForwardRef, isFeatureModule, isModuleWithParams, isRootModule } from './type-guards';
import { getLastProviders } from './get-last-providers';

export function getModuleMetadata(
  modOrObj: ModuleType | ModuleWithParams,
  isRoot?: boolean
): (ModuleMetadata & { decoratorFactory: AnyFn }) | undefined {
  const typeGuard = isRoot ? isRootModule : (m: Container) => isFeatureModule(m) || isRootModule(m);

  if (isForwardRef(modOrObj)) {
    modOrObj = modOrObj();
  }

  if (isModuleWithParams(modOrObj)) {
    const modWitParams = modOrObj;
    const container = reflector
      .getClassMetadata<ModuleMetadata>(modWitParams.module)
      .find((container) => typeGuard(container));

    const modMetadata = container?.value;
    const modName = getModuleName(modWitParams.module);
    if (!modMetadata) {
      return modMetadata;
    }

    if (modMetadata.id) {
      const msg =
        `${modName} must not have an "id" in the metadata of the decorator @Module. ` +
        'Instead, you can specify the "id" in the object that contains the module parameters.';
      throw new Error(msg);
    }
    const metadata = Object.assign({}, modMetadata);
    metadata.id = modWitParams.id;
    metadata.providersPerApp = getLastProviders(mergeArrays(modMetadata.providersPerApp, modWitParams.providersPerApp));
    metadata.providersPerMod = getLastProviders(mergeArrays(modMetadata.providersPerMod, modWitParams.providersPerMod));
    metadata.providersPerRou = getLastProviders(mergeArrays(modMetadata.providersPerRou, modWitParams.providersPerRou));
    metadata.providersPerReq = getLastProviders(mergeArrays(modMetadata.providersPerReq, modWitParams.providersPerReq));
    metadata.extensionsMeta = { ...modMetadata.extensionsMeta, ...modWitParams.extensionsMeta };
    return { ...metadata, decoratorFactory: container.factory };
  } else {
    const container = reflector.getClassMetadata<ModuleMetadata>(modOrObj).find((container) => typeGuard(container));
    return container ? { ...container.value, decoratorFactory: container.factory } : undefined;
  }
}
