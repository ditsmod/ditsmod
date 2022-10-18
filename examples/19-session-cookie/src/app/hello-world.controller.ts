import { Controller, Res, Route } from '@ditsmod/core';
import { SessionCookie } from '@ditsmod/session-cookie';

@Controller()
export class HelloWorldController {
  constructor(private session: SessionCookie, private res: Res) {}

  @Route('GET', 'set')
  setCookie() {
    this.session.id = '123';
    this.res.send('Hello World!\n');
  }

  @Route('GET', 'get')
  getCookie() {
    this.res.send(`session ID: ${this.session.id}`);
  }
}
