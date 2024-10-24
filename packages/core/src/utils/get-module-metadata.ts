import { DecoratorAndValue, reflector, resolveForwardRef } from '#di';
import { ModuleWithParams, ModuleMetadata } from '#types/module-metadata.js';
import { AnyFn, ModuleType, Scope } from '#types/mix.js';
import { getModuleName } from './get-module-name.js';
import { mergeArrays } from './merge-arrays.js';
import { isFeatureModule, isModuleWithParams, isRootModule } from './type-guards.js';
import { getLastProviders } from './get-last-providers.js';

/**
 * Merges metadata passed in `rootModule` or `featureModule` decorators with metadata passed
 * in `ModuleWithParams`. Additionally, converts the `Providers` instances passed in the `providersPer*`
 * property to arrays.
 */
export function getModuleMetadata(
  modOrObj: ModuleType | ModuleWithParams,
  isRoot?: boolean,
): ModuleMetadataWithContext | undefined {
  const typeGuard = isRoot ? isRootModule : (m: DecoratorAndValue) => isFeatureModule(m) || isRootModule(m);

  modOrObj = resolveForwardRef(modOrObj);

  if (isModuleWithParams(modOrObj)) {
    const modWitParams = modOrObj;
    const container = reflector.getMetadata<ModuleMetadataValue>(modWitParams.module).constructor?.decorators?.find(typeGuard);
    const modMetadata = container?.value.data;
    if (!modMetadata) {
      return modMetadata;
    }

    if (modMetadata.id) {
      const modName = getModuleName(modWitParams.module);
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
    const declaredInDir = container.declaredInDir || '';
    return { ...metadata, decoratorFactory: container.decorator, declaredInDir };
  } else {
    const container = reflector.getMetadata<ModuleMetadataValue>(modOrObj).constructor?.decorators?.find(typeGuard);
    const modMetadata = container?.value.data;
    if (!modMetadata) {
      return modMetadata;
    }
    const metadata = Object.assign({}, modMetadata);
    (['App', 'Mod', 'Rou', 'Req'] as Scope[]).forEach((scope) => {
      const arr = [...(modMetadata[`providersPer${scope}`] || [])];
      if (arr.length) {
        metadata[`providersPer${scope}`] = arr;
      }
    });
    const declaredInDir = container?.declaredInDir || '';
    return container ? { ...metadata, decoratorFactory: container.decorator, declaredInDir } : undefined;
  }
}

export interface ModuleMetadataValue {
  data: ModuleMetadata;
}

export interface ModuleMetadataWithContext extends ModuleMetadata {
  decoratorFactory: AnyFn;
  declaredInDir: string;
}
