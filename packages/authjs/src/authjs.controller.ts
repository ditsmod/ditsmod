import { controller, SingletonRequestContext, inject } from '@ditsmod/core';
import { getParams, oasRoute } from '@ditsmod/openapi';
import { Auth, type AuthConfig, setEnvDefaults } from '@auth/core';

import { AUTHJS_CONFIG } from '#mod/constants.js';
import { toDitsmodResponse, toWebRequest } from '#mod/http-api-adapters.js';
import { Params } from './types.js';

@controller({ scope: 'ctx' })
export class AuthjsController {
  constructor(@inject(AUTHJS_CONFIG) protected config: AuthConfig) {
    setEnvDefaults(process.env, this.config);
  }

  @oasRoute('GET', ':action', {
    tags: ['authjs'],
    description: '',
    parameters: getParams('path', true, Params, 'action'),
  })
  @oasRoute('POST', ':action/:providerType', {
    tags: ['authjs'],
    description: '',
    parameters: getParams('path', true, Params, 'action', 'providerType'),
  })
  async handle(ctx: SingletonRequestContext) {
    return toDitsmodResponse(await Auth(toWebRequest(ctx), this.config), ctx.rawRes);
  }
}
