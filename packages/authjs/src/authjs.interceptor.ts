import { Status, injectable } from '@ditsmod/core';
import { Auth, setEnvDefaults } from '@auth/core';
import { RequestContext, HttpHandler, HttpInterceptor, applyHeaders, applyResponse } from '@ditsmod/rest';

import { toWebRequest } from '#mod/http-api-adapters.js';
import { AuthjsConfig } from './authjs.config.js';

@injectable()
export class AuthjsInterceptor implements HttpInterceptor {
  constructor(protected config: AuthjsConfig) {
    setEnvDefaults(process.env, config);
  }

  async intercept(next: HttpHandler, reqCtx: RequestContext) {
    let response = await Auth(toWebRequest(reqCtx), this.config);
    if (response.body || (response.status != Status.OK && response.status != Status.FOUND)) {
      await applyResponse(response, reqCtx.rawRes);
      return;
    }
    if (response.status == Status.FOUND) {
      const headers = new Headers(response.headers);
      headers.delete('location');
      response = new Response(undefined, { headers });
    }
    applyHeaders(response, reqCtx.rawRes);
    return next.handle();
  }
}
