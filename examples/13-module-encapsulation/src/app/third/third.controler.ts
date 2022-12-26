import { inject } from '@ts-stack/di';
import { controller, Res, route } from '@ditsmod/core';

@controller()
export class ThirdController {
  constructor(private res: Res, @inject('multi-provider') private multiProvider: any) {}

  @route('GET', 'third')
  getHello() {
    this.res.sendJson(this.multiProvider);
  }
}
