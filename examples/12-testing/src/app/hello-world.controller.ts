import { controller, RequestContext, route } from '@ditsmod/core';

import { MyService } from './my.service';

@controller()
export class HelloWorldController {
  constructor(private myService: MyService) {}

  @route('GET')
  async helloWorld(ctx: RequestContext) {
    const message = await this.myService.helloWorld();
    ctx.res.send(message);
  }

  @route('GET', 'admin')
  async helloAdmin(ctx: RequestContext) {
    const message = await this.myService.helloAdmin();
    ctx.res.send(message);
  }
}
