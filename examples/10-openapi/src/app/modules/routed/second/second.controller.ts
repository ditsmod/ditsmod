import { Res } from '@ditsmod/core';
import { oasRoute } from '@ditsmod/openapi';
import { controller } from '@ditsmod/routing';

import { BearerGuard } from './bearer.guard.js';

@controller()
export class SecondController {
  @oasRoute('GET', 'second', [BearerGuard])
  getSome(res: Res) {
    res.sendJson({ ok: 1 });
  }
}
