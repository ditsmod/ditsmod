import { Class, injectable } from '#di';
import { ExtensionsGroupToken, TotalStage1Meta, Extension } from '#types/extension-types.js';
import { AnyModule } from '../imports-resolver.js';

@injectable()
export class ExtensionsContext {
  mTotalStage1Meta = new Map<ExtensionsGroupToken, TotalStage1Meta[]>();
  /**
   * The pending list of extensions that want to receive the initialization result
   * of `groupToken` from the whole application.
   */
  mExtensionPendingList = new Map<ExtensionsGroupToken, Map<Class<Extension>, Extension>>();

  mStage = new Map<AnyModule, Set<Extension>>();
}
