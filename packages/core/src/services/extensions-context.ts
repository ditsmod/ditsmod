import { Class, injectable } from '#di';
import { ExtensionsGroupToken, ExtensionManagerInitMeta, Extension } from '#types/extension-types.js';

@injectable()
export class ExtensionsContext {
  mTotalInitMeta = new Map<ExtensionsGroupToken, ExtensionManagerInitMeta[]>();
  /**
   * Contains extensions that subscribe to a specific `groupToken` from across the application.
   */
  mCaller = new Map<ExtensionsGroupToken, Map<Class<Extension>, Extension>>();
  /**
   * Indicates whether the application has routes.
   */
  appHasRoutes = false;
}
