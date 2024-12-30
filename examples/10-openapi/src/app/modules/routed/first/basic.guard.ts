import { CanActivate, Status, RequestContext } from '@ditsmod/core';
import { oasGuard } from '@ditsmod/openapi';

@oasGuard({
  tags: ['withBasicAuth'],
  securitySchemeObject: {
    type: 'http',
    scheme: 'basic',
    description:
      'Enter username: `demo`, password: `p@55w0rd`. For more info see ' +
      '[Authentication](https://developer.mozilla.org/en-US/docs/Web/HTTP/Authentication)',
  },
  responses: {
    [Status.UNAUTHORIZED]: {
      $ref: '#/components/responses/UnauthorizedError',
    },
  },
})
export class BasicGuard implements CanActivate {
  canActivate(ctx: RequestContext) {
    const { authorization } = ctx.rawReq.headers;
    if (!authorization) {
      return this.unauth(ctx);
    }
    const [, base64] = authorization.split(' ');
    if (base64 != 'ZGVtbzpwQDU1dzByZA==') {
      return this.unauth(ctx);
    }

    return true;
  }

  protected unauth(ctx: RequestContext) {
    ctx.rawRes.setHeader('WWW-Authenticate', 'Basic realm="Access to the API endpoint"');
    return new Response(null, { status: Status.UNAUTHORIZED });
  }
}
