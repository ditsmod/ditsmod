import { RequestContext, controller, route } from '@ditsmod/rest';
import { RequestContextWithSession, SessionCookie } from '@ditsmod/session-cookie';

@controller()
export class HelloWorldController {
  constructor(private session: SessionCookie) {}

  @route('GET', 'set')
  setCookie(ctx: RequestContext) {
    this.session.id = '123';
    ctx.send('Hello, World!\n');
  }

  @route('GET', 'get')
  getCookie(ctx: RequestContext) {
    ctx.send(`session ID: ${this.session.id}`);
  }
}

@controller({ scope: 'route' })
export class HelloWorldController2 {
  @route('GET', 'set2')
  setCookie(ctx: RequestContextWithSession) {
    ctx.sessionCookie.id = '123';
    ctx.send('Hello, World!\n');
  }

  @route('GET', 'get2')
  getCookie(ctx: RequestContextWithSession) {
    ctx.send(`session ID: ${ctx.sessionCookie.id}`);
  }
}
