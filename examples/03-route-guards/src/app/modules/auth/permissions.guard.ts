import { injectable } from '@ts-stack/di';
import { CanActivate, Status } from '@ditsmod/core';

import { AuthService } from './auth.service';
import { Permission } from './types';

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
