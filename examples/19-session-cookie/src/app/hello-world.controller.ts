import { controller, RequestContext, route } from '@ditsmod/core';
import { SessionCookie } from '@ditsmod/session-cookie';

@controller()
export class HelloWorldController {
  constructor(private session: SessionCookie) {}

  @route('GET', 'set')
  setCookie(ctx: RequestContext) {
    this.session.id = '123';
    ctx.res.send('Hello World!\n');
  }

  @route('GET', 'get')
  getCookie(ctx: RequestContext) {
    ctx.res.send(`session ID: ${this.session.id}`);
  }
}
