import { Res } from '@ditsmod/core';
import { controller, route } from '@ditsmod/routing';

import { MyService } from './my.service.js';

@controller()
export class HelloWorldController {
  constructor(private myService: MyService) {}

  @route('GET')
  async helloWorld(res: Res) {
    const message = await this.myService.helloWorld();
    res.send(message);
  }

  @route('GET', 'admin')
  async helloAdmin(res: Res) {
    const message = await this.myService.helloAdmin();
    res.send(message);
  }
}
