import { CanActivate, trpcGuard, TrpcOpts } from '@ditsmod/trpc';
import { TRPCError } from '@trpc/server';

import { AuthService } from './auth.service.js';
import { Permission } from './types.js';

@trpcGuard()
export class PermissionsGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(opts: TrpcOpts, params?: Permission[]) {
    if (await this.authService.hasPermissions(params)) {
      return true;
    } else {
      throw new TRPCError({ code: 'FORBIDDEN' });
    }
  }
}
