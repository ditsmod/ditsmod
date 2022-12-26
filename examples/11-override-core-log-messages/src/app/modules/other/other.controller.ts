import { controller, Res, route } from '@ditsmod/core';

import { SomeService } from '../some/some.service';

@controller()
export class OtherController {
  constructor(private res: Res, private someService: SomeService) {}

  @route('GET')
  tellHello() {
    this.someService.setSomeLog();
    this.res.send(`I'm OtherController\n`);
  }
}
