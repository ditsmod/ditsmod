import { CanActivate, RequestContext, Status } from '@ditsmod/core';
import { guard } from '@ditsmod/routing';

const basicAuth = process.env.BASIC_AUTH;
if (!basicAuth) {
  throw new Error('You need setup BASIC_AUTH variable in ".env" file.');
}

/**
 * See [WWW-Authenticate](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/WWW-Authenticate)
 * for more info.
 */
@guard()
export class BasicGuard implements CanActivate {
  canActivate(ctx: RequestContext, [realm]: [string?] = []) {
    const { authorization } = ctx.rawReq.headers;
    if (!authorization) {
      return this.unauth(ctx, realm);
    }
    const expectBase64 = Buffer.from(basicAuth!, 'utf8').toString('base64');
    const [authType, actualBase64] = authorization.split(' ');
    if (authType != 'Basic' || actualBase64 != expectBase64) {
      return this.unauth(ctx, realm);
    }
    return true;
  }

  protected unauth(ctx: RequestContext, realm?: string): Response {
    realm ??= 'Access to the API endpoint';
    ctx.rawRes.setHeader('WWW-Authenticate', `Basic realm="${realm}"`);
    return new Response(null, { status: Status.UNAUTHORIZED });
  }
}
