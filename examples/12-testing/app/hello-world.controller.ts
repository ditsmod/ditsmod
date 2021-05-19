import { Controller, Response, Route } from '@ditsmod/core';

import { MyService } from './my.service';

@Controller()
export class HelloWorldController {
  constructor(private res: Response, private myService: MyService) {}

  @Route('GET')
  async helloWorld() {
    const message = await this.myService.helloWorld();
    this.res.send(message);
  }

  @Route('GET', 'admin')
  async helloAdmin() {
    const message = await this.myService.helloAdmin();
    this.res.send(message);
  }
}
