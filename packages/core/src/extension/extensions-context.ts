import { Class, injectable } from '#di';
import { ExtensionClass, Stage1ExtensionMeta, Extension } from '#extension/extension-types.js';
import { ModRefId } from '#types/mix.js';

@injectable()
export class ExtensionsContext {
  mStage1ExtensionMeta = new Map<ExtensionClass, Stage1ExtensionMeta[]>();
  /**
   * The pending list of extensions that want to receive the initialization result
   * of `ExtCls` from the whole application.
   */
  mExtensionPendingList = new Map<ExtensionClass, Map<Class<Extension>, Extension>>();

  mStage = new Map<ModRefId, Set<Extension>>();
}
