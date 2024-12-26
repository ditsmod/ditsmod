import { controller, RequestContext } from '@ditsmod/core';
import { route } from '@ditsmod/routing';

import { BearerGuard } from '../auth/bearer.guard.js';
import { requirePermissionsSngl } from '../auth/guards-utils.js';
import { Permission } from '../auth/types.js';

@controller({ scope: 'module' })
export class Controller2 {
  @route('GET', 'controler2-of-module1')
  ok(ctx: RequestContext) {
    ctx.send('ok');
  }

  @route('GET', 'unauth2', [BearerGuard])
  throw401Error(ctx: RequestContext) {
    ctx.send('some secret');
  }

  @route('GET', 'forbidden2', [requirePermissionsSngl(Permission.canActivateAdministration)])
  throw403Error(ctx: RequestContext) {
    ctx.send('some secret');
  }
}
