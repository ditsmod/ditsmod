import { CanActivate, Status, injectable, RequestContext } from '@ditsmod/core';

import { AuthService } from './auth.service';
import { Permission } from './types';

@injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(ctx: RequestContext, params?: Permission[]) {
    if (await this.authService.hasPermissions(params)) {
      return true;
    } else {
      return Status.FORBIDDEN;
    }
  }
}
