import { Res, controller, route } from '@ditsmod/rest';
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

@controller({ scope: 'route' })
export class HelloWorldController2 {
  @route('GET', 'set2')
  setCookie(reqCtx: RequestContextWithSession) {
    reqCtx.sessionCookie.id = '123';
    reqCtx.send('Hello, World!\n');
  }

  @route('GET', 'get2')
  getCookie(reqCtx: RequestContextWithSession) {
    reqCtx.send(`session ID: ${reqCtx.sessionCookie.id}`);
  }
}
