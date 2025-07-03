import { inject } from '@ditsmod/core';
import { controller, route, Res } from '@ditsmod/rest';

@controller()
export class SecondController {
  constructor(@inject('multi-provider') private multiProvider: any) {}

  @route('GET', 'second')
  getHello(res: Res) {
    res.sendJson(this.multiProvider);
  }
}
