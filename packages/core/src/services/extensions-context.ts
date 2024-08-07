import { Class, injectable } from '#di';
import { ExtensionsGroupToken, Extension } from '#types/extension-types.js';

@injectable()
export class ExtensionsContext {
  mExtensionsData = new Map<Class<Extension<any>>, Map<ExtensionsGroupToken, any[]>>();
  /**
   * Indicates whether the application has routes.
   */
  appHasRoutes = false;
}
