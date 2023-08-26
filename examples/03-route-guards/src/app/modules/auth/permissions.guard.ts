import { CanActivate, Status, injectable } from '@ditsmod/core';

import { AuthService } from './auth.service.js';
import { Permission } from './types.js';

@injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(params?: Permission[]) {
    if (await this.authService.hasPermissions(params)) {
      return true;
    } else {
      return Status.FORBIDDEN;
    }
  }
}
