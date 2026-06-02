import { RequestContext, controller, route } from '@ditsmod/rest';

import { MyService } from './my.service.js';

@controller()
export class HelloWorldController {
  constructor(private myService: MyService) {}

  @route('GET')
  async helloWorld(reqCtx: RequestContext) {
    const message = await this.myService.helloWorld();
    reqCtx.send(message);
  }

  @route('GET', 'admin')
  async helloAdmin(reqCtx: RequestContext) {
    const message = await this.myService.helloAdmin();
    reqCtx.send(message);
  }
}
