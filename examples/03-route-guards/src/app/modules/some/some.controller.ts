import { controller, Res, route } from '@ditsmod/core';

import { AuthGuard } from '../auth/auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permission } from '../auth/types';

@controller()
export class SomeController {
  constructor(private res: Res) {}

  @route('GET')
  ok() {
    this.res.send('ok');
  }

  @route('GET', 'unauth', [AuthGuard])
  throw401Error() {
    this.res.send('some secret');
  }

  @route('GET', 'forbidden', [[PermissionsGuard, Permission.canActivateAdministration]])
  throw403Error() {
    this.res.send('some secret');
  }
}
