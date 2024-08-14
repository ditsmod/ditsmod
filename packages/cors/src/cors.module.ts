import { featureModule, ModuleWithParams, Providers } from '@ditsmod/core';
import { PRE_ROUTER_EXTENSIONS } from '@ditsmod/routing';
import { CorsOptions as CorsOpts } from '@ts-stack/cors';

import { CORS_EXTENSIONS } from './constans.js';
import { CorsExtension } from './cors.extension.js';
import { CorsService } from './cors.service.js';

@featureModule({
  providersPerReq: [CorsService],
  exports: [CorsService],
  extensions: [
    { extension: CorsExtension, groupToken: CORS_EXTENSIONS, nextToken: PRE_ROUTER_EXTENSIONS, exported: true },
  ],
})
export class CorsModule {
  static withParams(options: CorsOpts): ModuleWithParams<CorsModule> {
    return {
      module: this,
      providersPerMod: new Providers().useValue<CorsOpts>(CorsOpts, options),
      exports: [CorsOpts],
    };
  }
}
