import { rootModule } from '@ditsmod/core';

import { Module1 } from './module1/module1.js';
import { PreRouter } from '../adapters/ditsmod/pre-router.js';
import { TRPC_OPTS } from '../adapters/ditsmod/constants.js';
import { trpcOpts } from './server.js';

@rootModule({
  imports: [Module1],
  providersPerApp: [PreRouter, { token: TRPC_OPTS, useValue: trpcOpts }],
})
export class AppModule {}
