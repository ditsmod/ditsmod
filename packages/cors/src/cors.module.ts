import { featureModule, ModuleWithParams, Providers } from '@ditsmod/core';
import { PRE_ROUTER_EXTENSIONS, ROUTE_EXTENSIONS } from '@ditsmod/routing';
import { CorsOptions } from '@ts-stack/cors';

import { CORS_EXTENSIONS } from './constans.js';
import { CorsExtension } from './cors.extension.js';
import { CorsService } from './cors.service.js';

@featureModule({
  providersPerReq: [CorsService],
  exports: [CorsService],
  extensions: [
    {
      extension: CorsExtension,
      group: CORS_EXTENSIONS,
      afterGroups: [ROUTE_EXTENSIONS],
      beforeGroups: [PRE_ROUTER_EXTENSIONS],
      export: true,
    },
  ],
})
export class CorsModule {
  static withParams(options: CorsOptions): ModuleWithParams<CorsModule> {
    return {
      module: this,
      providersPerMod: new Providers().useValue<CorsOptions>(CorsOptions, options),
      exports: [CorsOptions],
    };
  }
}
