import { CanActivate, injectable, RequestContext } from '@ditsmod/core';
import { JwtService, VerifyErrors } from '@ditsmod/jwt';

@injectable()
export class BearerGuard implements CanActivate {
  constructor(private jwtService: JwtService, private ctx: RequestContext) {}

  async canActivate() {
    const authValue = this.ctx.nodeReq.headers.authorization?.split(' ');
    if (authValue?.[0] != 'Bearer') {
      return false;
    }

    const token = authValue[1];
    const payload = await this.jwtService
      .verifyWithSecret(token)
      .then((payload) => payload)
      .catch((err: VerifyErrors) => false as const); // Here `as const` to narrow down returned type.

    if (payload) {
      this.ctx.req.jwtPayload = payload;
      return true;
    } else {
      return false;
    }
  }
}
