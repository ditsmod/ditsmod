import { controller, SingletonRequestContext } from '@ditsmod/core';
import { route } from '@ditsmod/routing';
import { Auth, type AuthConfig, setEnvDefaults } from '@auth/core';
import { inject } from '@ditsmod/core';

import { AUTHJS_CONFIG } from '#mod/constants.js';
import { toDitsmodResponse, toWebRequest } from '#mod/http-api-adapters.js';

@controller({ scope: 'module' })
export class AuthjsController {
  constructor(@inject(AUTHJS_CONFIG) protected config: AuthConfig) {
    this.config.basePath ??= '/auth';
  }

  @route('GET', ':param1')
  async checkAuth1(ctx: SingletonRequestContext) {
    setEnvDefaults(process.env, this.config);
    return toDitsmodResponse(await Auth(toWebRequest(ctx), this.config), ctx.rawRes);
  }

  @route('POST', ':param1/:param2')
  async checkAuth2(ctx: SingletonRequestContext) {
    setEnvDefaults(process.env, this.config);
    return toDitsmodResponse(await Auth(toWebRequest(ctx), this.config), ctx.rawRes);
  }
}