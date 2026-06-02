import { RequestContext, controller, route } from '@ditsmod/rest';
import { RequestContextWithSession, SessionCookie } from '@ditsmod/session-cookie';

@controller()
export class HelloWorldController {
  constructor(private session: SessionCookie) {}

  @route('GET', 'set')
  setCookie(reqCtx: RequestContext) {
    this.session.id = '123';
    reqCtx.send('Hello, World!\n');
  }

  @route('GET', 'get')
  getCookie(reqCtx: RequestContext) {
    reqCtx.send(`session ID: ${this.session.id}`);
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
