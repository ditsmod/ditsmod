import { Injectable } from '@ts-stack/di';

@Injectable()
export class ExtensionsContext {
  /**
   * Indicates whether the current extension call is the last.
   */
  isLastModule = false;
  /**
   * Indicates whether the application has routes.
   */
  appHasRoutes = false;
}
