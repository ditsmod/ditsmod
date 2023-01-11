import { controller, route, inject, Res } from '@ditsmod/core';

@controller()
export class FirstController {
  constructor(@inject('multi-provider') private multiProvider: any) {}

  @route('GET', 'first')
  getHello(res: Res) {
    res.sendJson(this.multiProvider);
  }
}
