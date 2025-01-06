import { RequestContext, Status, injectable } from '@ditsmod/core';
import { Auth, setEnvDefaults } from '@auth/core';
import { HttpHandler, HttpInterceptor, applyHeaders, applyResponse } from '@ditsmod/routing';

import { toWebRequest } from '#mod/http-api-adapters.js';
import { AuthjsConfig } from './authjs.config.js';

@injectable()
export class AuthjsInterceptor implements HttpInterceptor {
  constructor(protected config: AuthjsConfig) {
    setEnvDefaults(process.env, config);
  }

  async intercept(next: HttpHandler, ctx: RequestContext) {
    let response = await Auth(toWebRequest(ctx), this.config);
    if (response.body || (response.status != Status.OK && response.status != Status.FOUND)) {
      await applyResponse(response, ctx.rawRes);
      return;
    }
    if (response.status == Status.FOUND) {
      const headers = new Headers(response.headers);
      headers.delete('location');
      response = new Response(undefined, { headers });
    }
    applyHeaders(response, ctx.rawRes);
    return next.handle();
  }
}
