import { controller, Logger, SingletonRequestContext } from '@ditsmod/core';
import { route } from '@ditsmod/routing';
import { Auth, type AuthConfig, setEnvDefaults } from '@auth/core';
import { inject } from '@ditsmod/core';
import { LoggerInstance } from '@auth/core/types';

import { AUTHJS_CONFIG } from '#mod/constants.js';
import { toDitsmodResponse, toWebRequest } from '#mod/http-api-adapters.js';

@controller({ scope: 'module' })
export class AuthjsController {
  constructor(
    @inject(AUTHJS_CONFIG) protected config: AuthConfig,
    protected logger: Logger,
  ) {
    this.patchAuthjsConfig();
  }

  @route('GET', ':action')
  @route('POST', ':action/:provider')
  async handleAction(ctx: SingletonRequestContext) {
    setEnvDefaults(process.env, this.config);
    return toDitsmodResponse(await Auth(toWebRequest(ctx), this.config), ctx.rawRes);
  }

  protected patchAuthjsConfig() {
    this.config.basePath ??= '/api/auth';

    this.config.logger ??= {
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
