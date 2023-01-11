import { controller, Res, route } from '@ditsmod/core';

import { SomeService } from '../some/some.service';

@controller()
export class OtherController {
  constructor(private someService: SomeService) {}

  @route('GET')
  tellHello(res: Res) {
    this.someService.setSomeLog();
    res.send("I'm OtherController\n");
  }
}
