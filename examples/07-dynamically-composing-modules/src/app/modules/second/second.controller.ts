import { controller, Res, route } from '@ditsmod/core';

@controller()
export class SecondController {
  constructor(private res: Res) {}

  @route('GET', 'get-2')
  async tellHello() {
    this.res.send('second module.\n');
  }
}
