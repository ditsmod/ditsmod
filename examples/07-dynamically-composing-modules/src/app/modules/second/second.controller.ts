import { controller, Res, route } from '@ditsmod/core';

@controller()
export class SecondController {
  @route('GET', 'get-2')
  async tellHello(res: Res) {
    res.send('second module.\n');
  }
}
