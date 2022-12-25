import { inject } from '@ts-stack/di';
import { Controller, Res, Route } from '@ditsmod/core';

@Controller()
export class ThirdController {
  constructor(private res: Res, @inject('multi-provider') private multiProvider: any) {}

  @Route('GET', 'third')
  getHello() {
    this.res.sendJson(this.multiProvider);
  }
}
