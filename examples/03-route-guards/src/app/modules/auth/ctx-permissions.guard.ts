import { CanActivate, RequestContext, Status, guard } from '@ditsmod/core';

import { Permission } from './types.js';
import { CtxAuthService } from './ctx-auth.service.js';

@guard()
export class CtxPermissionsGuard implements CanActivate {
  constructor(private authService: CtxAuthService) {}

  async canActivate(ctx: RequestContext, params?: Permission[]) {
    if (await this.authService.hasPermissions(ctx, params)) {
      return true;
    } else {
      return Status.FORBIDDEN;
    }
  }
}
