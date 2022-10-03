import { Module, PRE_ROUTER_EXTENSIONS } from '@ditsmod/core';

import { CORS_EXTENSIONS } from './constans';
import { CorsExtension } from './cors.extension';

@Module({
  extensions: [
    { extension: CorsExtension, groupToken: CORS_EXTENSIONS, nextToken: PRE_ROUTER_EXTENSIONS, exported: true },
  ],
})
export class CorsModule {}
