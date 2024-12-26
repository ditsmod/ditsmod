import { featureModule, OnModuleInit, Logger, inject } from '@ditsmod/core';
import { type AuthConfig } from '@auth/core';
import { RoutingModule } from '@ditsmod/routing';
import { BodyParserModule } from '@ditsmod/body-parser';
import { LoggerInstance } from '@auth/core/types';

import { AUTHJS_CONFIG, AUTHJS_SESSION } from './constants.js';
import { AuthjsController } from '#mod/authjs.controller.js';
import { AuthjsGuard } from '#mod/authjs.guard.js';
import { AuthjsPerRouGuard } from './authjs-per-rou.guard.js';

/**
 * Ditsmod module to support [Auth.js][1].
 *
 * [1]: https://authjs.dev/
 */
@featureModule({
  imports: [RoutingModule, BodyParserModule],
  providersPerMod: [{ token: AUTHJS_CONFIG, useValue: {} }],
  providersPerRou: [{ token: AuthjsGuard, useClass: AuthjsPerRouGuard }],
  providersPerReq: [AuthjsGuard, { token: AUTHJS_SESSION, useValue: {} }],
  controllers: [AuthjsController],
  exports: [AUTHJS_CONFIG, AUTHJS_SESSION, AuthjsGuard],
})
export class AuthjsModule implements OnModuleInit {
  constructor(
    @inject(AUTHJS_CONFIG) protected authConfig: AuthConfig,
    protected logger: Logger,
  ) {}

  onModuleInit() {
    this.patchAuthjsConfig();
  }

  protected patchAuthjsConfig() {
    this.authConfig.logger ??= {
      error: (message) => {
        this.logger.log('error', `Auth.js error: ${message}`);
      },
      debug: (message) => {
        this.logger.log('debug', `Auth.js message: ${message}`);
      },
      warn: (message) => {
        this.logger.log('warn', `Auth.js message: ${message}`);
      },
    } satisfies LoggerInstance;
  }
}
