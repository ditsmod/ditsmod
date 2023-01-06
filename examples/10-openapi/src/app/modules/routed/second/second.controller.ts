import { controller, RequestContext, Res, route } from '@ditsmod/core';
import { oasRoute } from '@ditsmod/openapi';

import { BearerGuard } from './bearer.guard';

@controller()
export class SecondController {
  @oasRoute('GET', 'second', [BearerGuard])
  getSome(ctx: RequestContext) {
    ctx.res.sendJson({ ok: 1 });
  }
}
