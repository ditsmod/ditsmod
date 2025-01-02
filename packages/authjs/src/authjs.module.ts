import { featureModule, OnModuleInit, ChainError } from '@ditsmod/core';
import { PRE_ROUTER_EXTENSIONS, RoutingModule } from '@ditsmod/routing';
import { BodyParserModule } from '@ditsmod/body-parser';
import { LoggerInstance } from '@auth/core/types';

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
  providersPerMod: [AuthjsConfig, AuthjsLogMediator],
  providersPerRou: [{ token: AuthjsGuard, useClass: AuthjsPerRouGuard }],
  providersPerReq: [AuthjsGuard, { token: AUTHJS_SESSION }],
  extensions: [
    { extension: AuthjsExtension, group: AUTHJS_EXTENSIONS, beforeGroup: PRE_ROUTER_EXTENSIONS, exported: true },
  ],
  exports: [AuthjsConfig, AUTHJS_SESSION, AuthjsGuard, BodyParserModule],
})
export class AuthjsModule implements OnModuleInit {
  constructor(
    protected authConfig: AuthjsConfig,
    protected logMediator: AuthjsLogMediator,
  ) {}

  onModuleInit() {
    this.patchAuthjsConfig();
  }

  protected patchAuthjsConfig() {
    this.authConfig.logger ??= {
      error: (err) => {
        this.logMediator.message('error', ChainError.getFullStack(err)!);
      },
      debug: (message) => {
        this.logMediator.message('debug', message);
      },
      warn: (message) => {
        this.logMediator.message('warn', message);
      },
    } satisfies LoggerInstance;
  }
}
