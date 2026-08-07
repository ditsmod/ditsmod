import { HttpStatus } from '@holu/core';
import { RequestContext, CanActivate, guard } from '@holu/rest';

import { AuthService } from './auth.service.js';
import { Permission } from './types.js';

@guard()
export class RequestScopedPermissionsGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(ctx: RequestContext, params?: Permission[]) {
    if (await this.authService.hasPermissions(params)) {
      return true;
    } else {
      return new Response(null, { status: HttpStatus.FORBIDDEN });
    }
  }
}
