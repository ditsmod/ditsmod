import { featureModule, ModuleWithParams } from '@ditsmod/core';
import { type AuthConfig } from '@auth/core';
import { RoutingModule } from '@ditsmod/routing';
import { BodyParserModule } from '@ditsmod/body-parser';

import { AUTHJS_CONFIG } from './constants.js';
import { AuthjsController } from '#mod/authjs.controller.js';

/**
 * Ditsmod module to support [Auth.js][1].
 *
 * [1]: https://authjs.dev/
 */
@featureModule({
  imports: [RoutingModule, BodyParserModule],
  controllers: [AuthjsController],
  exports: [BodyParserModule]
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
