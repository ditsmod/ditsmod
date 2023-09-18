import { DecoratorAndValue, reflector, resolveForwardRef } from '#di';
import { ModuleMetadata } from '#types/module-metadata.js';
import { AnyFn, ModuleType, ModuleWithParams } from '#types/mix.js';
import { getModuleName } from './get-module-name.js';
import { mergeArrays } from './merge-arrays.js';
import { isFeatureModule, isModuleWithParams, isRootModule } from './type-guards.js';
import { getLastProviders } from './get-last-providers.js';

export function getModuleMetadata(
  modOrObj: ModuleType | ModuleWithParams,
  isRoot?: boolean,
): ModuleMetadataWithContext | undefined {
  const typeGuard = isRoot ? isRootModule : (m: DecoratorAndValue) => isFeatureModule(m) || isRootModule(m);

  modOrObj = resolveForwardRef(modOrObj);

  if (isModuleWithParams(modOrObj)) {
    const modWitParams = modOrObj;
    const container = reflector.getClassMetadata<ModuleMetadataValue>(modWitParams.module).find(typeGuard);
    const modMetadata = container?.value.data;
    const modName = getModuleName(modWitParams.module);
    if (!modMetadata) {
      return modMetadata;
    }

    if (modMetadata.id) {
      const msg =
        `${modName} must not have an "id" in the metadata of the decorator @featureModule. ` +
        'Instead, you can specify the "id" in the object that contains the module parameters.';
      throw new Error(msg);
    }
    const metadata = Object.assign({}, modMetadata);
    metadata.id = modWitParams.id;
    metadata.providersPerApp = getLastProviders(mergeArrays(modMetadata.providersPerApp, modWitParams.providersPerApp));
    metadata.providersPerMod = getLastProviders(mergeArrays(modMetadata.providersPerMod, modWitParams.providersPerMod));
    metadata.providersPerRou = getLastProviders(mergeArrays(modMetadata.providersPerRou, modWitParams.providersPerRou));
    metadata.providersPerReq = getLastProviders(mergeArrays(modMetadata.providersPerReq, modWitParams.providersPerReq));
    metadata.exports = getLastProviders(mergeArrays(modMetadata.exports, modWitParams.exports));
    metadata.extensionsMeta = { ...modMetadata.extensionsMeta, ...modWitParams.extensionsMeta };
    const declaredInDir = container.value.declaredInDir;
    return { ...metadata, decoratorFactory: container.decorator, declaredInDir };
  } else {
    const container = reflector.getClassMetadata<ModuleMetadataValue>(modOrObj).find(typeGuard);
    const declaredInDir = container?.value.declaredInDir || '';
    return container ? { ...container.value.data, decoratorFactory: container.decorator, declaredInDir } : undefined;
  }
}

export interface ModuleMetadataValue {
  data: ModuleMetadata;
  /**
   * The directory in which the module was declared.
   */
  declaredInDir: string;
}

export interface ModuleMetadataWithContext extends ModuleMetadata {
  decoratorFactory: AnyFn;
  declaredInDir: string;
}
