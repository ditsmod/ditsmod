import { Status } from '@ditsmod/core';
import { RequestContext, CanActivate, guard } from '@ditsmod/rest';

import { AuthService } from './auth.service.js';
import { Permission } from './types.js';

@guard()
export class PermissionsGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(ctx: RequestContext, params?: Permission[]) {
    if (await this.authService.hasPermissions(params)) {
      return true;
    } else {
      return new Response(null, { status: Status.FORBIDDEN });
    }
  }
}
