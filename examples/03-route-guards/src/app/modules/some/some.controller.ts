import { controller, Res, route } from '@ditsmod/core';

import { AuthGuard } from '../auth/auth.guard.js';
import { requirePermissions } from '../auth/guards-utils.js';
import { Permission } from '../auth/types.js';

@controller()
export class SomeController {
  @route('GET')
  ok(res: Res) {
    res.send('ok');
  }

  @route('GET', 'unauth', [AuthGuard])
  throw401Error(res: Res) {
    res.send('some secret');
  }

  @route('GET', 'forbidden', [requirePermissions(Permission.canActivateAdministration)])
  throw403Error(res: Res) {
    res.send('some secret');
  }
}
