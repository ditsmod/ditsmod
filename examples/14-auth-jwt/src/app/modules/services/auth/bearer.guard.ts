import { CanActivate, injectable, Injector, RequestContext } from '@ditsmod/core';
import { JwtService, JWT_PAYLOAD, VerifyErrors } from '@ditsmod/jwt';

@injectable()
export class BearerGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private injector: Injector
  ) {}

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
      this.injector.setByToken(JWT_PAYLOAD, payload);
      return true;
    } else {
      return false;
    }
  }
}
