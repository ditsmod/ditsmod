import { Controller, Response, Route } from '@ditsmod/core';

import { ThreeService } from './three/three.service';

@Controller()
export class AppController {
  constructor(private readonly threeService: ThreeService, private res: Response) {}

  @Route('GET')
  getHello() {
    this.res.send(this.threeService.getHello());
  }
}
