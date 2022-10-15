import { Module, ModuleWithParams, PRE_ROUTER_EXTENSIONS, Providers } from '@ditsmod/core';
import { CorsOptions as CorsOpts } from '@ts-stack/cors';

import { CORS_EXTENSIONS } from './constans';
import { CorsExtension } from './cors.extension';
import { CorsService } from './cors.service';

@Module({
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
      providersPerMod: [
        ...new Providers().useValue<CorsOpts>(CorsOpts, options)
      ],
      exports: [CorsOpts]
    };
  }
}
