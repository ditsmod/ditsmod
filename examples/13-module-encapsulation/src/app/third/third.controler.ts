import { controller, Res, route, inject } from '@ditsmod/core';

@controller()
export class ThirdController {
  constructor(private res: Res, @inject('multi-provider') private multiProvider: any) {}

  @route('GET', 'third')
  getHello() {
    this.res.sendJson(this.multiProvider);
  }
}
