import { Class, injectable } from '#di';
import { ExtensionsGroupToken, TotalInitMeta, Extension } from '#types/extension-types.js';

@injectable()
export class ExtensionsContext {
  mTotalInitMeta = new Map<ExtensionsGroupToken, TotalInitMeta[]>();
  /**
   * The pending list of extensions that want to receive the initialization result
   * of `groupToken` from the whole application.
   */
  mExtensionPendingList = new Map<ExtensionsGroupToken, Map<Class<Extension>, Extension>>();
}
