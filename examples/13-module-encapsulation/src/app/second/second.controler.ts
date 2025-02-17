import { controller, inject, Res } from '@ditsmod/core';
import { route } from '@ditsmod/routing';

@controller()
export class SecondController {
  constructor(@inject('multi-provider') private multiProvider: any) {}

  @route('GET', 'second')
  getHello(res: Res) {
    res.sendJson(this.multiProvider);
  }
}
