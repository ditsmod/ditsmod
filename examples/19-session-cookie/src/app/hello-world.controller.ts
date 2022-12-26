import { controller, Res, route } from '@ditsmod/core';
import { SessionCookie } from '@ditsmod/session-cookie';

@controller()
export class HelloWorldController {
  constructor(private session: SessionCookie, private res: Res) {}

  @route('GET', 'set')
  setCookie() {
    this.session.id = '123';
    this.res.send('Hello World!\n');
  }

  @route('GET', 'get')
  getCookie() {
    this.res.send(`session ID: ${this.session.id}`);
  }
}
