import { injectable } from '#di';
import { ExtensionsGroupToken, ExtensionManagerInitMeta } from '#types/extension-types.js';

@injectable()
export class ExtensionsContext {
  mTotalInitMeta = new Map<ExtensionsGroupToken, ExtensionManagerInitMeta[]>();
  /**
   * Indicates whether the application has routes.
   */
  appHasRoutes = false;
}
