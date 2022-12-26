import { controller, Res, route, inject } from '@ditsmod/core';

@controller()
export class FirstController {
  constructor(private res: Res, @inject('multi-provider') private multiProvider: any) {}

  @route('GET', 'first')
  getHello() {
    this.res.sendJson(this.multiProvider);
  }
}
