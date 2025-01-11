import { Injector, Status } from '@ditsmod/core';
import { JwtService, VerifyErrors, JWT_PAYLOAD } from '@ditsmod/jwt';
import { oasGuard } from '@ditsmod/openapi';
import { CanActivate, RequestContext } from '@ditsmod/routing';

/**
 * If user successfully passed this guard, you can use JWT payload by `JwtPayload` token.
 */
@oasGuard({
  securitySchemeObject: {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
    description:
      'See docs for [Bearer Authentication](https://swagger.io/docs/specification/authentication/bearer-authentication/)',
  },
  responses: {
    [Status.UNAUTHORIZED]: {
      $ref: '#/components/responses/UnauthorizedError',
    },
  },
})
export class BearerGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private injector: Injector,
  ) {}

  async canActivate(ctx: RequestContext) {
    const authValue = ctx.rawReq.headers.authorization?.split(' ');
    if (authValue?.[0] != 'Token') {
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
