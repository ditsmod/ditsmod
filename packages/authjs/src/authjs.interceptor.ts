import { HttpStatus, injectable } from '@ditsmod/core';
import { Auth, setEnvDefaults } from '@auth/core';
import { RequestContext, HttpHandler, HttpInterceptor, applyHeaders, applyResponse } from '@ditsmod/rest';

import { toWebRequest } from '#mod/http-api-adapters.js';
import { AuthjsConfig } from './authjs.config.js';

@injectable()
export class AuthjsInterceptor implements HttpInterceptor {
  constructor(protected config: AuthjsConfig) {
    setEnvDefaults(process.env, config);
  }

  async intercept(next: HttpHandler, ctx: RequestContext) {
    const webReq = toWebRequest(ctx);
    let response = await Auth(webReq, this.config);
    if (response.body || (response.status != HttpStatus.OK && response.status != HttpStatus.FOUND)) {
      await applyResponse(response, ctx.rawRes);
      return;
    }
    if (response.status == HttpStatus.FOUND) {
      const location = response.headers.get('location');
      if (location) {
        try {
          const locOrigin = new URL(location, webReq.url).origin;
          const reqOrigin = new URL(webReq.url).origin;
          if (locOrigin !== reqOrigin) {
            await applyResponse(response, ctx.rawRes);
            return;
          }
        } catch {
          // Ignore invalid URLs
        }
      }
      const headers = new Headers(response.headers);
      headers.delete('location');
      response = new Response(undefined, { headers });
    }
    applyHeaders(response, ctx.rawRes);
    return next.handle();
  }
}
