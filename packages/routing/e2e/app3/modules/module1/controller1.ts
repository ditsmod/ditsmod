import { controller, Res } from '@ditsmod/core';
import { route } from '@ditsmod/routing';

import { BearerGuard } from '../auth/bearer.guard.js';
import { basicAuth, requirePermissions } from '../auth/guards-utils.js';
import { Permission } from '../auth/types.js';

@controller()
export class Controller1 {
  @route('GET', 'controler1-of-module1')
  ok(res: Res) {
    res.send('ok');
  }

  @route('GET', 'basic-auth', [basicAuth('Access to the API endpoint')])
  basicAuth(res: Res) {
    res.send('You are now authorized with BasicGuard');
  }

  @route('GET', 'unauth', [BearerGuard])
  throw401Error(res: Res) {
    res.send('some secret');
  }

  @route('GET', 'forbidden', [requirePermissions(Permission.canActivateAdministration)])
  throw403Error(res: Res) {
    res.send('some secret');
  }
}
