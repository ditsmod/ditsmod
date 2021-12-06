import { Inject } from '@ts-stack/di';
import { Controller, Response, Route } from '@ditsmod/core';

import { MultiProvider2Service } from './multi-provider-2.service';

@Controller()
export class SecondController {
  constructor(private res: Response, @Inject('multi-provider') private multiProvider: MultiProvider2Service) {}

  @Route('GET', 'second')
  getHello() {
    this.res.sendJson(this.multiProvider);
  }
}
