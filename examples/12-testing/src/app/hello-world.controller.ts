import { controller, Res, route } from '@ditsmod/core';

import { MyService } from './my.service';

@controller()
export class HelloWorldController {
  constructor(private res: Res, private myService: MyService) {}

  @route('GET')
  async helloWorld() {
    const message = await this.myService.helloWorld();
    this.res.send(message);
  }

  @route('GET', 'admin')
  async helloAdmin() {
    const message = await this.myService.helloAdmin();
    this.res.send(message);
  }
}
