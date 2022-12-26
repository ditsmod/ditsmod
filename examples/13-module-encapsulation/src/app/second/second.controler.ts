import { controller, Res, route, inject } from '@ditsmod/core';

@controller()
export class SecondController {
  constructor(private res: Res, @inject('multi-provider') private multiProvider: any) {}

  @route('GET', 'second')
  getHello() {
    this.res.sendJson(this.multiProvider);
  }
}
