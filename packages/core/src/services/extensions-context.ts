import { injectable, Type } from '@ts-stack/di';

import { Extension, ExtensionsGroupToken } from '../types/mix';

@injectable()
export class ExtensionsContext {
  mExtensionsData = new Map<Type<Extension<any>>, Map<ExtensionsGroupToken, any[]>>();
  /**
   * Indicates whether the application has routes.
   */
  appHasRoutes = false;
}
