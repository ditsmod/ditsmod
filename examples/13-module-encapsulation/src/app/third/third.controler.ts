import { controller, inject, Res } from '@ditsmod/core';
import { route } from '@ditsmod/routing';

@controller()
export class ThirdController {
  constructor(@inject('multi-provider') private multiProvider: any) {}

  @route('GET', 'third')
  getHello(res: Res) {
    res.sendJson(this.multiProvider);
  }
}
