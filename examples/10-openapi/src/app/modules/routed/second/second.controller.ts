import { controller, Res, route } from '@ditsmod/core';

@controller()
export class SecondController {
  constructor(private res: Res) {}

  @route('GET', 'second')
  getSome() {
    this.res.sendJson({ ok: 1 });
  }
}
