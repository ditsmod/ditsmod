import { Controller, Res, Route } from '@ditsmod/core';

@Controller()
export class SecondController {
  constructor(private res: Res) {}

  @Route('GET', 'second')
  getSome() {
    this.res.sendJson({ ok: 1 });
  }
}
