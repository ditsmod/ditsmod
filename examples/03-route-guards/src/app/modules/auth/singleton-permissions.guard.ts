import { CanActivate, RequestContext, Status, guard } from '@ditsmod/core';

import { Permission } from './types.js';
import { SingletonAuthService } from './singleton-auth.service.js';

@guard()
export class SingletonPermissionsGuard implements CanActivate {
  constructor(private authService: SingletonAuthService) {}

  async canActivate(ctx: RequestContext, params?: Permission[]) {
    if (await this.authService.hasPermissions(ctx, params)) {
      return true;
    } else {
      return Status.FORBIDDEN;
    }
  }
}
