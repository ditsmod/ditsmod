import { Controller, Res, Route } from '@ditsmod/core';

import { AuthGuard } from '../auth/auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permission } from '../auth/types';

@Controller()
export class SomeController {
  constructor(private res: Res) {}

  @Route('GET')
  ok() {
    this.res.send('ok');
  }

  @Route('GET', 'unauth', [AuthGuard])
  throw401Error() {
    this.res.send('some secret');
  }

  @Route('GET', 'forbidden', [[PermissionsGuard, Permission.canActivateAdministration]])
  throw403Error() {
    this.res.send('some secret');
  }
}
