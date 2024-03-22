import { controller, RequestContext, Res, route } from '@ditsmod/core';

import { AuthGuard } from '../auth/auth.guard.js';
import { requirePermissions, requirePermissionsSngl } from '../auth/guards-utils.js';
import { Permission } from '../auth/types.js';
import { BasicGuard } from '../auth/basic.guard.js';

@controller()
export class SomeController {
  @route('GET', 'hello')
  ok(res: Res) {
    res.send('ok');
  }

  @route('GET', 'basic-auth', [BasicGuard])
  basicAuth(res: Res) {
    res.send('You are now authorized with BasicGuard');
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

@controller({ isSingleton: true })
export class SingletonController {
  @route('GET', 'hello2')
  ok(ctx: RequestContext) {
    ctx.nodeRes.end('ok');
  }

  @route('GET', 'unauth2', [AuthGuard])
  throw401Error(ctx: RequestContext) {
    ctx.nodeRes.end('some secret');
  }

  @route('GET', 'forbidden2', [requirePermissionsSngl(Permission.canActivateAdministration)])
  throw403Error(ctx: RequestContext) {
    ctx.nodeRes.end('some secret');
  }
}
