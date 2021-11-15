import { Controller, Route } from '@ditsmod/core';
import { ThreeService } from './three/three.service';

@Controller()
export class AppController {
  constructor(private readonly threeService: ThreeService) {}

  @Route('GET')
  getHello(): string {
    return this.threeService.getHello();
  }
}
