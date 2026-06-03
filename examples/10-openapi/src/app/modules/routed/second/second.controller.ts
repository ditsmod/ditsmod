import { RequestContext, controller } from '@ditsmod/rest';
import { oasRoute } from '@ditsmod/openapi';

import { BearerGuard } from './bearer.guard.js';

@controller()
export class SecondController {
  @oasRoute('GET', 'second', [BearerGuard])
  getSome(ctx: RequestContext) {
    ctx.sendJson({ ok: 1 });
  }
}
