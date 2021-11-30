import { Injectable, Type } from '@ts-stack/di';

import { Extension } from '../types/mix';
import { ExtensionsGroupToken } from './extensions-manager';

@Injectable()
export class ExtensionsContext {
  mExtensionsData = new Map<Type<Extension<any>>, Map<ExtensionsGroupToken, any[]>>();
  /**
   * Indicates whether the current extension call is the last.
   */
  isLastModule = false;
  /**
   * Indicates whether the application has routes.
   */
  appHasRoutes = false;
}
