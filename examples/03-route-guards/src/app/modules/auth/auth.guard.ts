import { CanActivate, inject, injectable, NODE_REQ, NodeRequest } from '@ditsmod/core';

@injectable()
export class AuthGuard implements CanActivate {
  constructor(@inject(NODE_REQ) private nodeReq: NodeRequest) {}

  async canActivate(params?: any[]) {
    const authValue = this.nodeReq.headers.authorization?.split(' ');
    if (authValue?.[0] != 'Token') {
      return false;
    }

    /**
     * Here you need implement more logic.
     */
    const token = authValue[1];
    return Boolean(token);
  }
}
