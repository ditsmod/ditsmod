import { injectable } from '#di/decorators.js';
import type { Class } from '#di/top/types-and-models.js';
import { ExtensionClass, ExtensionGroupMeta, Extension } from '#extension/extension-types.js';
import { ModRefId } from '#decorators/module-decorator-options.js';

@injectable()
export class ExtensionContext {
  extensionGroupMetaMap = new Map<ExtensionClass, ExtensionGroupMeta[]>();
  /**
   * The pending list of extensions that want to receive the initialization result
   * of `ExtensionClass` from the whole application.
   */
  extensionPendingMap = new Map<ExtensionClass, Map<Class<Extension>, Extension>>();

  stageMap = new Map<ModRefId, Set<Extension>>();
}
