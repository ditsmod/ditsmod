import { CanActivate, injectable, RequestContext } from '@ditsmod/core';
import { JwtService, VerifyErrors } from '@ditsmod/jwt';

@injectable()
export class BearerGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(ctx: RequestContext) {
    const authValue = ctx.nodeReq.headers.authorization?.split(' ');
    if (authValue?.[0] != 'Bearer') {
      return false;
    }

    const token = authValue[1];
    const payload = await this.jwtService
      .verifyWithSecret(token)
      .then((payload) => payload)
      .catch((err: VerifyErrors) => false as const); // Here `as const` to narrow down returned type.

    if (payload) {
      ctx.req.jwtPayload = payload;
      return true;
    } else {
      return false;
    }
  }
}
