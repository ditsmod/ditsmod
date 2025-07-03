import { Res, controller, route } from '@ditsmod/rest';

import { SomeService } from '../some/some.service.js';

@controller()
export class OtherController {
  constructor(private someService: SomeService) {}

  @route('GET')
  tellHello(res: Res) {
    this.someService.setSomeLog();
    res.send("I'm OtherController\n");
  }
}
