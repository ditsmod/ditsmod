import { inject } from '@ditsmod/core';
import { controller, route, Res } from '@ditsmod/rest';

@controller()
export class ThirdController {
  constructor(@inject('multi-provider') private multiProvider: any) {}

  @route('GET', 'third')
  getHello(res: Res) {
    res.sendJson(this.multiProvider);
  }
}
