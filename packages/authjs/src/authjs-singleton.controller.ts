import { Auth, type AuthConfig, setEnvDefaults } from '@auth/core';
import { controller, inject, optional, SingletonRequestContext } from '@ditsmod/core';
import { route } from '@ditsmod/routing';

import { toDitsmodResponse, toWebRequest } from './http-api-adapters.js';
import { AUTHJS_CONFIG } from './constants.js';

@controller({ scope: 'module' })
export class AuthjsSingletonController {
  constructor(@optional() @inject(AUTHJS_CONFIG) protected config: AuthConfig = { providers: [] }) {
    this.config.basePath ??= '/api/auth';
  }

  @route(['POST', 'PUT', 'PATCH'])
  async ditsmodAuth(ctx: SingletonRequestContext) {
    setEnvDefaults(process.env, this.config);
    await toDitsmodResponse(await Auth(toWebRequest(ctx), this.config), ctx.rawRes);
    return { ok: true };
  }
}
