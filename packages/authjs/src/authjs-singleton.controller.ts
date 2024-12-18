import { Auth, type AuthConfig, setEnvDefaults } from '@auth/core';
import { inject, injectable, SingletonRequestContext } from '@ditsmod/core';
import { route } from '@ditsmod/routing';

import { toDitsmodResponse, toWebRequest } from './http-api-adapters.js';
import { AUTHJS_CONFIG } from './constants.js';

@injectable()
export class AuthjsSingletonController {
  constructor(@inject(AUTHJS_CONFIG) protected config: AuthConfig) {
    this.config.basePath = '/api/auth';
  }

  @route(['POST', 'PUT', 'PATCH'])
  async ditsmodAuth(ctx: SingletonRequestContext) {
    setEnvDefaults(process.env, this.config);
    await toDitsmodResponse(await Auth(toWebRequest(ctx), this.config), ctx.rawRes);
  }
}
