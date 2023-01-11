import { controller, route, inject, Res } from '@ditsmod/core';

@controller()
export class SecondController {
  constructor(@inject('multi-provider') private multiProvider: any) {}

  @route('GET', 'second')
  getHello(res: Res) {
    res.sendJson(this.multiProvider);
  }
}
