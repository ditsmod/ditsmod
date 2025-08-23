import { rootModule } from '@ditsmod/core';

import { PostModule } from './post-module/post.module.js';
import { PreRouter } from '../adapters/ditsmod/pre-router.js';
import { TRPC_OPTS } from '../adapters/ditsmod/constants.js';
import {
  TRPC_CREATE_CALLER_FACTORY,
  TRPC_MERGE_ROUTERS,
  TRPC_PROCEDURE,
  TRPC_ROOT,
  TRPC_ROUTER,
} from './root-rpc-object.js';
import { MyExtension } from './my-extension.js';
import { awaitTokens } from './utils.js';

@rootModule({
  imports: [PostModule],
  providersPerApp: [
    PreRouter,
    ...awaitTokens([TRPC_ROOT, TRPC_ROUTER, TRPC_PROCEDURE, TRPC_MERGE_ROUTERS, TRPC_CREATE_CALLER_FACTORY, TRPC_OPTS]),
  ],
  extensions: [MyExtension],
})
export class AppModule {}
