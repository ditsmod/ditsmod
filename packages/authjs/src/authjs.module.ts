import { featureModule, ModuleWithParams } from '@ditsmod/core';
import { RoutingModule } from '@ditsmod/routing';
import { type AuthConfig } from '@auth/core';

import { AuthjsSingletonController } from './authjs-singleton.controller.js';
import { AUTHJS_CONFIG } from './constants.js';

/**
 * Ditsmod module to support [Auth.js][1].
 *
 * [1]: https://authjs.dev/
 */
@featureModule({
  imports: [RoutingModule],
  controllers: [AuthjsSingletonController],
})
export class AuthjsModule {
  static withParams(path: string, config: AuthConfig): ModuleWithParams<AuthjsModule> {
    return {
      path,
      module: this,
      providersPerMod: [{ token: AUTHJS_CONFIG, useValue: config }],
    };
  }
}
