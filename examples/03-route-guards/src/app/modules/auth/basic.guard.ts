import { Status } from '@ditsmod/core';
import { RequestContext, CanActivate, guard } from '@ditsmod/rest';

const basicAuth = process.env.BASIC_AUTH;
if (!basicAuth) {
  throw new Error('You need setup BASIC_AUTH variable in ".env" file.');
}

/**
 * See [WWW-Authenticate](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/WWW-Authenticate)
 * for more info.
 */
@guard()
export class RequestScopedBasicGuard implements CanActivate {
  canActivate(reqCtx: RequestContext, [realm]: [string?] = []) {
    const { authorization } = reqCtx.rawReq.headers;
    if (!authorization) {
      return this.unauth(reqCtx, realm);
    }
    const expectBase64 = Buffer.from(basicAuth!, 'utf8').toString('base64');
    const [authType, actualBase64] = authorization.split(' ');
    if (authType != 'Basic' || actualBase64 != expectBase64) {
      return this.unauth(reqCtx, realm);
    }
    return true;
  }

  protected unauth(reqCtx: RequestContext, realm?: string): Response {
    realm ??= 'Access to the API endpoint';
    reqCtx.rawRes.setHeader('WWW-Authenticate', `Basic realm="${realm}"`);
    return new Response(null, { status: Status.UNAUTHORIZED });
  }
}
