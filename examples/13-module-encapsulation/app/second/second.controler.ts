import { Inject } from '@ts-stack/di';
import { Controller, Res, Route } from '@ditsmod/core';

@Controller()
export class SecondController {
  constructor(private res: Res, @Inject('multi-provider') private multiProvider: any) {}

  @Route('GET', 'second')
  getHello() {
    this.res.sendJson(this.multiProvider);
  }
}
