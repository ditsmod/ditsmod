import { controller, RequestContext, route } from '@ditsmod/core';

import { AuthGuard } from '../auth/auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permission } from '../auth/types';

@controller()
export class SomeController {
  @route('GET')
  ok(ctx: RequestContext) {
    ctx.res.send('ok');
  }

  @route('GET', 'unauth', [AuthGuard])
  throw401Error(ctx: RequestContext) {
    ctx.res.send('some secret');
  }

  @route('GET', 'forbidden', [[PermissionsGuard, Permission.canActivateAdministration]])
  throw403Error(ctx: RequestContext) {
    ctx.res.send('some secret');
  }
}
