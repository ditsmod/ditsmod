import { controller, Res, route } from '@ditsmod/core';
import { oasRoute } from '@ditsmod/openapi';

import { BearerGuard } from './bearer.guard';

@controller()
export class SecondController {
  constructor(private res: Res) {}

  @oasRoute('GET', 'second', [BearerGuard])
  getSome() {
    this.res.sendJson({ ok: 1 });
  }
}
