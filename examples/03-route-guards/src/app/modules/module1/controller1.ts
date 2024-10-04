import { controller, Res, route } from '@ditsmod/core';
import { Permission, basicAuth, requirePermissions, BearerGuard } from '#auth';

@controller()
export class Controller1 {
  @route('GET', 'hello')
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
