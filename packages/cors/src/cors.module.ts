import { featureModule, ModuleWithParams, Providers } from '@ditsmod/core';
import { PreRouterExtension, RoutesExtension } from '@ditsmod/routing';
import { CorsOptions } from '@ts-stack/cors';

import { CorsExtension } from './cors.extension.js';
import { CorsService } from './cors.service.js';

@featureModule({
  providersPerReq: [CorsService],
  exports: [CorsService],
  extensions: [
    {
      extension: CorsExtension,
      afterExtensions: [RoutesExtension],
      beforeExtensions: [PreRouterExtension],
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
