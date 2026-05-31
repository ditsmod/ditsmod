import { Status } from '@ditsmod/core';
import { RequestContext, CanActivate, guard } from '@ditsmod/rest';

import { Permission } from './types.js';
import { RouteScopedAuthService } from './ctx-auth.service.js';

@guard()
export class RouteScopedPermissionsGuard implements CanActivate {
  constructor(private authService: RouteScopedAuthService) {}

  async canActivate(reqCtx: RequestContext, params?: Permission[]) {
    if (await this.authService.hasPermissions(reqCtx, params)) {
      return true;
    } else {
      return new Response(null, { status: Status.FORBIDDEN });
    }
  }
}
