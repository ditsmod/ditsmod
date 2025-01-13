import { Class, injectable } from '#di';
import { ExtensionsGroupToken, Stage1GroupMeta, Extension } from '#extension/extension-types.js';
import { ModRefId } from '#types/mix.js';

@injectable()
export class ExtensionsContext {
  mStage1GroupMeta = new Map<ExtensionsGroupToken, Stage1GroupMeta[]>();
  /**
   * The pending list of extensions that want to receive the initialization result
   * of `ExtCls` from the whole application.
   */
  mExtensionPendingList = new Map<ExtensionsGroupToken, Map<Class<Extension>, Extension>>();

  mStage = new Map<ModRefId, Set<Extension>>();
}
