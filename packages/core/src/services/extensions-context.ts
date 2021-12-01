import { Injectable, Type } from '@ts-stack/di';

import { Extension, ExtensionsGroupToken } from '../types/mix';

@Injectable()
export class ExtensionsContext {
  mExtensionsData = new Map<Type<Extension<any>>, Map<ExtensionsGroupToken, any[]>>();
  /**
   * Indicates whether the application has routes.
   */
  appHasRoutes = false;
}
