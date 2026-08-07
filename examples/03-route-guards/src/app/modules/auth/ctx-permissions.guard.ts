import { HttpStatus } from '@holu/core';
import { RequestContext, CanActivate, guard } from '@holu/rest';

import { Permission } from './types.js';
import { RouteScopedAuthService } from './ctx-auth.service.js';

@guard()
export class RouteScopedPermissionsGuard implements CanActivate {
  constructor(private authService: RouteScopedAuthService) {}

  async canActivate(ctx: RequestContext, params?: Permission[]) {
    if (await this.authService.hasPermissions(ctx, params)) {
      return true;
    } else {
      return new Response(null, { status: HttpStatus.FORBIDDEN });
    }
  }
}
