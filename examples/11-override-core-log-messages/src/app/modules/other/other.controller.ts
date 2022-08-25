import { Controller, Res, Route } from '@ditsmod/core';

import { SomeService } from '../some/some.service';

@Controller()
export class OtherController {
  constructor(private res: Res, private someService: SomeService) {}

  @Route('GET')
  tellHello() {
    this.someService.setSomeLog();
    this.res.send(`I'm OtherController\n`);
  }
}
