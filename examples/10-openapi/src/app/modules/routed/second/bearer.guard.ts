import { HttpStatus, Context } from '@holu/core';
import { JwtService, VerifyErrors, JWT_PAYLOAD } from '@holu/jwt';
import { oasGuard } from '@holu/openapi';
import { CanActivate, RequestContext } from '@holu/rest';

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
    [HttpStatus.UNAUTHORIZED]: {
      $ref: '#/components/responses/UnauthorizedError',
    },
  },
})
export class BearerGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private ctx: Context,
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
      this.ctx.set(JWT_PAYLOAD, payload);
      return true;
    } else {
      return false;
    }
  }
}
