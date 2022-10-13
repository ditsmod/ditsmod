import { ListenOptions } from 'net';

import { ServerOptions } from '../types/server-options';
import { HttpModule } from '../types/http-module';
import { ModuleType, ModuleWithParams } from './mix';

export interface RootModuleMetadata {
  httpModule?: HttpModule;
  serverOptions?: ServerOptions;
  listenOptions?: ListenOptions;
  path?: string;
  /**
   * An array of pairs, each of which is in the first place the provider's token,
   * and in the second - the module from which to import the provider with the specified token.
   */
  resolvedCollisionsPerApp?: [any, ModuleType | ModuleWithParams][];
}
