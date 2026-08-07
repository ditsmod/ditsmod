import { RequestContext, controller } from '@holu/rest';
import { oasRoute } from '@holu/openapi';

import { BearerGuard } from './bearer.guard.js';

@controller()
export class SecondController {
  @oasRoute('GET', 'second', [BearerGuard])
  getSome(ctx: RequestContext) {
    ctx.sendJson({ ok: 1 });
  }
}
