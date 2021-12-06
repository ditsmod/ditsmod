import { Inject } from '@ts-stack/di';
import { Controller, Response, Route } from '@ditsmod/core';

import { OnePerRouService } from './one/one-per-rou.service';
import { ThreeService } from './three/three.service';

@Controller()
export class AppController {
  constructor(
    private threeService: ThreeService,
    private onePerRouService: OnePerRouService,
    private res: Response,
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
