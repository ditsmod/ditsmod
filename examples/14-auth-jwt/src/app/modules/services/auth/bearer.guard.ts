import { CanActivate, inject, injectable, Injector, NodeRequest, NODE_REQ } from '@ditsmod/core';
import { JwtService, JWT_PAYLOAD, VerifyErrors } from '@ditsmod/jwt';

@injectable()
export class BearerGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    @inject(NODE_REQ) private nodeReq: NodeRequest,
    private injector: Injector
  ) {}

  async canActivate() {
    const authValue = this.nodeReq.headers.authorization?.split(' ');
    if (authValue?.[0] != 'Bearer') {
      return false;
    }

    const token = authValue[1];
    const payload = await this.jwtService
      .verifyWithSecret(token)
      .then((payload) => payload)
      .catch((err: VerifyErrors) => false as const); // Here `as const` to narrow down returned type.

    if (payload) {
      this.injector.setByToken(JWT_PAYLOAD, payload);
      return true;
    } else {
      return false;
    }
  }
}
