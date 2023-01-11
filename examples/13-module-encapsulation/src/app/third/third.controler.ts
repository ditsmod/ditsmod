import { controller, route, inject, Res } from '@ditsmod/core';

@controller()
export class ThirdController {
  constructor(@inject('multi-provider') private multiProvider: any) {}

  @route('GET', 'third')
  getHello(res: Res) {
    res.sendJson(this.multiProvider);
  }
}
