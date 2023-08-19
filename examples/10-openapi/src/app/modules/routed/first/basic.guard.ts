import { CanActivate, inject, NodeRequest, NodeResponse, NODE_REQ, NODE_RES, Status } from '@ditsmod/core';
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
  constructor(
    @inject(NODE_REQ) private nodeReq: NodeRequest,
    @inject(NODE_RES) private nodeRes: NodeResponse
  ) {}

  canActivate() {
    const { authorization } = this.nodeReq.headers;
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
    this.nodeRes.setHeader('WWW-Authenticate', 'Basic realm="Access to the API endpoint"');
    return Status.UNAUTHORIZED;
  }
}
