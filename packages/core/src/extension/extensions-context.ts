import { injectable } from '#di/decorators.js';
import type { Class } from '#di/top/types-and-models.js';
import { ExtensionClass, ExtensionGroupMeta, Extension } from '#extension/extension-types.js';
import { ModRefId } from '#types/mix.js';

@injectable()
export class ExtensionContext {
  mExtensionGroupMeta = new Map<ExtensionClass, ExtensionGroupMeta[]>();
  /**
   * The pending list of extensions that want to receive the initialization result
   * of `ExtensionClass` from the whole application.
   */
  mExtensionPendingList = new Map<ExtensionClass, Map<Class<Extension>, Extension>>();

  mStage = new Map<ModRefId, Set<Extension>>();
}
