import { CanActivate, Req, Res, Status } from '@ditsmod/core';
import { OasGuard } from '@ditsmod/openapi';

@OasGuard({
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
  constructor(private req: Req, private res: Res) {}

  canActivate() {
    const { authorization } = this.req.nodeReq.headers;
    if (!authorization) {
      return this.unauth();
    }
    const [, base64] = authorization.split(' ');
    if (base64 != 'ZGVtbzpwQDU1dzByZA==') {
      return this.unauth();
    }

    return true;
  }

  protected unauth() {
    this.res.nodeRes.setHeader('WWW-Authenticate', 'Basic realm="Access to the API endpoint"');
    return Status.UNAUTHORIZED;
  }
}
