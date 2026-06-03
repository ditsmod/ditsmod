import { RequestContext, controller, route } from '@ditsmod/rest';

import { MyService } from './my.service.js';

@controller()
export class HelloWorldController {
  constructor(private myService: MyService) {}

  @route('GET')
  async helloWorld(ctx: RequestContext) {
    const message = await this.myService.helloWorld();
    ctx.send(message);
  }

  @route('GET', 'admin')
  async helloAdmin(ctx: RequestContext) {
    const message = await this.myService.helloAdmin();
    ctx.send(message);
  }
}
