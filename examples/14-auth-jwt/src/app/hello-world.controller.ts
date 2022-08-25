import { Controller, Req, Res, Route } from '@ditsmod/core';

import { BearerGuard } from './modules/services/auth/bearer.guard';
import { MyJwtPayload } from './modules/services/auth/types';

@Controller()
export class HelloWorldController {
  constructor(private req: Req, private res: Res) {}

  @Route('GET')
  async getToken() {
    this.res.send('Hello, World!');
  }

  @Route('GET', 'profile', [BearerGuard])
  async getProfile() {
    const payload: MyJwtPayload = this.req.jwtPayload;
    this.res.send(`Hello, ${payload.userName}! You have successfully authorized.`);
  }
}
