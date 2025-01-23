import { RawMeta } from '#decorators/module.js';
import { resolveForwardRef, reflector } from '#di';
import { ModRefId } from '#types/mix.js';
import { getDebugClassName } from '#utils/get-debug-class-name.js';
import { mergeArrays } from '#utils/merge-arrays.js';
import { objectKeys } from '#utils/object-keys.js';
import { Providers } from '#utils/providers.js';
import { isRootModule, isModDecor, isModuleWithParams } from '#utils/type-guards.js';

/**
 * Merges metadata passed in `rootModule` or `featureModule` decorators with metadata passed
 * in `BaseModuleWithParams`. Merges only those properties that contain an array or an instance of the
 * `Providers` class.
 */
export function getModuleMetadata(modRefId: ModRefId, isRoot?: boolean): RawMeta | undefined {
  modRefId = resolveForwardRef(modRefId);
  const decoratorGuard = isRoot ? isRootModule : isModDecor;

  if (!isModuleWithParams(modRefId)) {
    return reflector.getDecorators(modRefId, decoratorGuard)?.at(0)?.value;
  }

  const modWitParams = modRefId;
  const decorAndVal = reflector.getDecorators(modWitParams.module, decoratorGuard)?.at(0);
  if (!decorAndVal) {
    return;
  }
  const modMetadata = decorAndVal.value;

  if (modMetadata.id) {
    const modName = getDebugClassName(modWitParams.module);
    const msg = `${modName} must not have an "id" in the metadata of the decorator @featureModule. ` +
      'Instead, you can specify the "id" in the object that contains the module parameters.';
    throw new Error(msg);
  }
  const metadata = Object.assign({}, modMetadata);
  metadata.id = modWitParams.id;
  if (isModuleWithParams(modWitParams)) {
    objectKeys(modWitParams).forEach((p) => {
      // If here is object with [Symbol.iterator]() method, this transform it to an array.
      if (Array.isArray(modWitParams[p]) || modWitParams[p] instanceof Providers) {
        (metadata as any)[p] = mergeArrays((metadata as any)[p], modWitParams[p]);
      }
    });

    metadata.extensionsMeta = { ...modMetadata.extensionsMeta, ...modWitParams.extensionsMeta };
  }
  return metadata;
}
