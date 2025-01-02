import { featureModule, isProvider, ModuleWithParams, Provider } from '@ditsmod/core';
import { PRE_ROUTER_EXTENSIONS, RoutingModule } from '@ditsmod/routing';
import { BodyParserModule } from '@ditsmod/body-parser';

import { AUTHJS_EXTENSIONS, AUTHJS_SESSION } from './constants.js';
import { AuthjsGuard } from '#mod/authjs.guard.js';
import { AuthjsPerRouGuard } from './authjs-per-rou.guard.js';
import { AuthjsLogMediator } from './authjs-log-mediator.js';
import { AuthjsExtension } from './authjs.extension.js';
import { AuthjsConfig } from './authjs.config.js';

/**
 * Ditsmod module to support [Auth.js][1].
 *
 * [1]: https://authjs.dev/
 */
@featureModule({
  imports: [RoutingModule, BodyParserModule],
  providersPerMod: [AuthjsLogMediator],
  providersPerRou: [{ token: AuthjsGuard, useClass: AuthjsPerRouGuard }],
  providersPerReq: [AuthjsGuard, { token: AUTHJS_SESSION }],
  extensions: [
    { extension: AuthjsExtension, group: AUTHJS_EXTENSIONS, beforeGroup: PRE_ROUTER_EXTENSIONS, exportedOnly: true },
  ],
  exports: [AUTHJS_SESSION, AuthjsGuard, BodyParserModule],
})
export class AuthjsModule {
  static withConfigProvider(providerOrConfig: Provider | AuthjsConfig): ModuleWithParams<AuthjsModule> {
    return {
      module: this,
      providersPerMod: [
        isProvider(providerOrConfig) ? providerOrConfig : { token: AuthjsConfig, useValue: providerOrConfig },
      ],
      exports: [AuthjsConfig],
    };
  }
}
