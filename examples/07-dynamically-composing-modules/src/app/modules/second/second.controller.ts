import { Res } from '@ditsmod/core';
import { controller, route } from '@ditsmod/routing';

@controller()
export class SecondController {
  @route('GET', 'get-2')
  async tellHello(res: Res) {
    res.send('second module.\n');
  }
}
