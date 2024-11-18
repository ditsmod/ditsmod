import { reflector, resolveForwardRef } from '#di';
import { ModRefId, Scope } from '#types/mix.js';
import { mergeArrays } from './merge-arrays.js';
import { isAppendsWithParams, isModDecor, isModuleWithParams, isRootModDecor } from './type-guards.js';
import { getLastProviders } from './get-last-providers.js';
import { getDebugModuleName } from './get-debug-module-name.js';
import { ModuleMetadataWithContext } from '../decorators/module.js';

/**
 * Merges metadata passed in `rootModule` or `featureModule` decorators with metadata passed
 * in `ModuleWithParams`. Additionally, converts the `Providers` instances passed in the `providersPer*`
 * property to arrays.
 */
export function getModuleMetadata(modRefId: ModRefId, isRoot?: boolean): ModuleMetadataWithContext | undefined {
  modRefId = resolveForwardRef(modRefId);
  const decoratorGuard = isRoot ? isRootModDecor : isModDecor;

  if (!isModuleWithParams(modRefId) && !isAppendsWithParams(modRefId)) {
    return reflector.getDecorators(modRefId, decoratorGuard)?.at(0)?.value;
  }

  const modWitParams = modRefId;
  const decorAndVal = reflector.getDecorators(modWitParams.module, decoratorGuard)?.at(0);
  if (!decorAndVal) {
    return;
  }
  const modMetadata = decorAndVal.value;

  if (modMetadata.id) {
    const modName = getDebugModuleName(modWitParams.module);
    const msg =
      `${modName} must not have an "id" in the metadata of the decorator @featureModule. ` +
      'Instead, you can specify the "id" in the object that contains the module parameters.';
    throw new Error(msg);
  }
  const metadata = Object.assign({}, modMetadata);
  metadata.id = modWitParams.id;
  const scopes = ['App', 'Mod', 'Rou', 'Req'] as Scope[];
  if (isModuleWithParams(modWitParams)) {
    scopes.forEach((scope) => {
      const arr1 = modMetadata[`providersPer${scope}`];
      const arr2 = modWitParams[`providersPer${scope}`];
      metadata[`providersPer${scope}`] = getLastProviders(mergeArrays(arr1, arr2));
    });
    metadata.exports = getLastProviders(mergeArrays(modMetadata.exports, modWitParams.exports));
    metadata.extensionsMeta = { ...modMetadata.extensionsMeta, ...modWitParams.extensionsMeta };
  }
  metadata.guards = modRefId.guards || [];
  return metadata;
}
