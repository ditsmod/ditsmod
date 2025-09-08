import { injectable, Injector } from '@ditsmod/core';
import { CanActivate, TrpcOpts } from '@ditsmod/trpc';

/***
 * This guard works only per route.
 */
@injectable()
export class BearerCtxGuard implements CanActivate {
  constructor(protected injector: Injector) {}

  async canActivate(opts: TrpcOpts, params?: any[]) {
    const authValue = opts.ctx.req.headers.authorization?.split(' ');
    if (authValue?.[0] != 'Bearer') {
      return false;
    }

    /**
     * Here you need implement more logic.
     */
    const token = authValue[1];
    return token === 'secret';
  }
}
