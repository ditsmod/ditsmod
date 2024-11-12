import { DecoratorAndValue, reflector, resolveForwardRef } from '#di';
import { ModuleMetadata } from '#types/module-metadata.js';
import { AnyFn, GuardItem, ModRefId, Scope } from '#types/mix.js';
import { mergeArrays } from './merge-arrays.js';
import { isAppendsWithParams, isFeatureModule, isModuleWithParams, isRootModule } from './type-guards.js';
import { getLastProviders } from './get-last-providers.js';
import { getDebugModuleName } from './get-debug-module-name.js';

/**
 * Merges metadata passed in `rootModule` or `featureModule` decorators with metadata passed
 * in `ModuleWithParams`. Additionally, converts the `Providers` instances passed in the `providersPer*`
 * property to arrays.
 */
export function getModuleMetadata(modRefId: ModRefId, isRoot?: boolean): ModuleMetadataWithContext | undefined {
  const typeGuard = isRoot ? isRootModule : (m: DecoratorAndValue) => isFeatureModule(m) || isRootModule(m);

  modRefId = resolveForwardRef(modRefId);
  const scopes = ['App', 'Mod', 'Rou', 'Req'] as Scope[];

  if (isModuleWithParams(modRefId) || isAppendsWithParams(modRefId)) {
    const modWitParams = modRefId;
    const decoratorAndValue = reflector
      .getMetadata<ModuleMetadataValue>(modWitParams.module)
      ?.constructor.decorators.find(typeGuard);
    const modMetadata = decoratorAndValue?.value.data;
    if (!modMetadata) {
      return modMetadata;
    }

    if (modMetadata.id) {
      const modName = getDebugModuleName(modWitParams.module);
      const msg =
        `${modName} must not have an "id" in the metadata of the decorator @featureModule. ` +
        'Instead, you can specify the "id" in the object that contains the module parameters.';
      throw new Error(msg);
    }
    const metadata = Object.assign({}, modMetadata);
    metadata.id = modWitParams.id;
    if (isModuleWithParams(modWitParams)) {
      scopes.forEach((scope) => {
        const arr1 = modMetadata[`providersPer${scope}`];
        const arr2 = modWitParams[`providersPer${scope}`];
        metadata[`providersPer${scope}`] = getLastProviders(mergeArrays(arr1, arr2));
      });
      metadata.exports = getLastProviders(mergeArrays(modMetadata.exports, modWitParams.exports));
      metadata.extensionsMeta = { ...modMetadata.extensionsMeta, ...modWitParams.extensionsMeta };
    }
    const declaredInDir = decoratorAndValue.declaredInDir || '';
    return {
      ...metadata,
      decoratorFactory: decoratorAndValue.decorator,
      declaredInDir,
      guards: modRefId.guards || [],
    };
  } else {
    const decoratorAndValue = reflector
      .getMetadata<ModuleMetadataValue>(modRefId)
      ?.constructor.decorators.find(typeGuard);
    const modMetadata = decoratorAndValue?.value.data;
    if (!modMetadata) {
      return modMetadata;
    }
    const metadata = Object.assign({}, modMetadata);
    scopes.forEach((scope) => {
      const arr = [...(modMetadata[`providersPer${scope}`] || [])];
      if (arr.length) {
        metadata[`providersPer${scope}`] = arr;
      }
    });
    const declaredInDir = decoratorAndValue?.declaredInDir || '';
    return decoratorAndValue
      ? { ...metadata, decoratorFactory: decoratorAndValue.decorator, declaredInDir, guards: [] }
      : undefined;
  }
}

export interface ModuleMetadataValue {
  data: ModuleMetadata;
}

export interface ModuleMetadataWithContext extends ModuleMetadata {
  decoratorFactory: AnyFn;
  declaredInDir: string;
  guards: GuardItem[];
}
