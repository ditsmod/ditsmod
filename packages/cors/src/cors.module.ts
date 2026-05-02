import { featureModule, ModuleWithParams, Providers } from '@ditsmod/core';
import { initRest, PreRouterExtension, RouteExtension } from '@ditsmod/rest';
import { CorsOptions } from '@ts-stack/cors';

import { CorsExtension } from './cors.extension.js';
import { CorsService } from './cors.service.js';

@initRest({
  providersPerReq: [CorsService],
  exports: [CorsService],
  extensions: [
    {
      extension: CorsExtension,
      afterExtensions: [RouteExtension],
      beforeExtensions: [PreRouterExtension],
      export: true,
    },
  ],
})
@featureModule()
export class CorsModule {
  static withParams(options: CorsOptions): ModuleWithParams<CorsModule> {
    return {
      module: this,
      providersPerMod: new Providers().useValue<CorsOptions>(CorsOptions, options),
      exports: [CorsOptions],
    };
  }
}
