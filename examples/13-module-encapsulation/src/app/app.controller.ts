import { Inject } from '@ts-stack/di';
import { Controller, Res, Route } from '@ditsmod/core';

import { FirstPerRouService } from './first/first-per-rou.service';
import { ThirdService } from './third/three.service';

@Controller()
export class AppController {
  constructor(
    private threeService: ThirdService,
    private onePerRouService: FirstPerRouService,
    private res: Res,
    @Inject('multi-provider') private multiProvider: any
  ) {}

  @Route('GET')
  showCounters() {
    const msg = `per req counter: ${this.threeService.getCounter()}, per rou counter: ${this.onePerRouService.getCounter()}`;
    this.res.send(msg);
  }

  @Route('POST')
  showRequestBody() {
    this.res.sendJson({ body: this.threeService.getBody() });
  }

  @Route('GET', 'zero')
  getMultiProvideValue() {
    this.res.sendJson(this.multiProvider);
  }
}
