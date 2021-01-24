import { Injectable } from '@ts-stack/di';
import { CanActivate, Status } from '@ts-stack/ditsmod';

import { AuthService } from './auth.service';
import { Permission } from './types';

@Injectable()
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
