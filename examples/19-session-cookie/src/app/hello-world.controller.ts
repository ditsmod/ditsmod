import { Res, controller, route } from '@ditsmod/routing';
import { RequestContextWithSession, SessionCookie } from '@ditsmod/session-cookie';

@controller()
export class HelloWorldController {
  constructor(private session: SessionCookie) {}

  @route('GET', 'set')
  setCookie(res: Res) {
    this.session.id = '123';
    res.send('Hello, World!\n');
  }

  @route('GET', 'get')
  getCookie(res: Res) {
    res.send(`session ID: ${this.session.id}`);
  }
}

@controller({ scope: 'ctx' })
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
