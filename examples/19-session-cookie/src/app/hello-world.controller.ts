import { controller, Res, route } from '@ditsmod/core';
import { SessionCookie } from '@ditsmod/session-cookie';

@controller()
export class HelloWorldController {
  constructor(private session: SessionCookie) {}

  @route('GET', 'set')
  setCookie(res: Res) {
    this.session.id = '123';
    res.send('Hello World!\n');
  }

  @route('GET', 'get')
  getCookie(res: Res) {
    res.send(`session ID: ${this.session.id}`);
  }
}
