import { Controller, Response, Route } from '@ditsmod/core';

@Controller()
export class SecondController {
  constructor(private res: Response) {}

  @Route('GET', 'second')
  getSome() {
    this.res.sendJson({ ok: 1 });
  }
}
