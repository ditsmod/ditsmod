import { Controller, Res, Route } from '@ditsmod/core';

import { OtherLogMediator } from './other-log-mediator';

@Controller()
export class OtherController {
  constructor(private res: Res, private otherLogMediator: OtherLogMediator) {}

  @Route('GET', 'other')
  tellHello() {
    this.otherLogMediator.someNewMethod(this, 'other');
    this.res.send(`I'm OtherController\n`);
  }
}
