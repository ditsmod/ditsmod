import { Inject } from '@ts-stack/di';
import { Controller, Response, Route } from '@ditsmod/core';

import { MultiProvider1Service } from './multi-provider-1.service';

@Controller()
export class FirstController {
  constructor(private res: Response, @Inject('multi-provider') private multiProvider: MultiProvider1Service) {}

  @Route('GET', 'first')
  getHello() {
    this.res.sendJson(this.multiProvider);
  }
}
