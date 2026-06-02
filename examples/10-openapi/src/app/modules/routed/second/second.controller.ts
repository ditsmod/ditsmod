import { RequestContext, controller } from '@ditsmod/rest';
import { oasRoute } from '@ditsmod/openapi';

import { BearerGuard } from './bearer.guard.js';

@controller()
export class SecondController {
  @oasRoute('GET', 'second', [BearerGuard])
  getSome(reqCtx: RequestContext) {
    reqCtx.sendJson({ ok: 1 });
  }
}
