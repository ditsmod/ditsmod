import { controller, RequestContext, Res, route } from '@ditsmod/core';

import { BearerGuard } from '../auth/bearer.guard.js';
import { basicAuth, requirePermissions, requirePermissionsSngl } from '../auth/guards-utils.js';
import { Permission } from '../auth/types.js';

@controller()
export class SomeController {
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

@controller({ isSingleton: true })
export class SingletonController {
  @route('GET', 'hello2')
  ok(ctx: RequestContext) {
    ctx.nodeRes.end('ok');
  }

  @route('GET', 'unauth2', [BearerGuard])
  throw401Error(ctx: RequestContext) {
    ctx.nodeRes.end('some secret');
  }

  @route('GET', 'forbidden2', [requirePermissionsSngl(Permission.canActivateAdministration)])
  throw403Error(ctx: RequestContext) {
    ctx.nodeRes.end('some secret');
  }
}
