import { injectable, Class } from '#di';
import { Extension, ExtensionsGroupToken } from '#types/mix.js';

@injectable()
export class ExtensionsContext {
  mExtensionsData = new Map<Class<Extension<any>>, Map<ExtensionsGroupToken, any[]>>();
  /**
   * Indicates whether the application has routes.
   */
  appHasRoutes = false;
}
