import { controller, Req, Res, route } from '@ditsmod/core';

import { BearerGuard } from './modules/services/auth/bearer.guard';
import { MyJwtPayload } from './modules/services/auth/types';

@controller()
export class HelloWorldController {
  constructor(private req: Req, private res: Res) {}

  @route('GET')
  async getToken() {
    this.res.send('Hello World!\n');
  }

  @route('GET', 'profile', [BearerGuard])
  async getProfile() {
    const payload: MyJwtPayload = this.req.jwtPayload;
    this.res.send(`Hello, ${payload.userName}! You have successfully authorized.`);
  }
}
