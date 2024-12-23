import { controller, SingletonRequestContext, inject } from '@ditsmod/core';
import { route } from '@ditsmod/routing';
import { Auth, type AuthConfig, setEnvDefaults } from '@auth/core';

import { AUTHJS_CONFIG } from '#mod/constants.js';
import { toDitsmodResponse, toWebRequest } from '#mod/http-api-adapters.js';

@controller({ scope: 'module' })
export class AuthjsController {
  constructor(@inject(AUTHJS_CONFIG) protected config: AuthConfig) {}

  @route('GET', ':action')
  @route('POST', ':action/:provider')
  async handleAction(ctx: SingletonRequestContext) {
    setEnvDefaults(process.env, this.config);
    return toDitsmodResponse(await Auth(toWebRequest(ctx), this.config), ctx.rawRes);
  }
}
