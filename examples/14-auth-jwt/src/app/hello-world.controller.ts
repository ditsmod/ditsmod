import { controller, inject, Res, route } from '@ditsmod/core';
import { JwtPayload } from '@ditsmod/jwt';

import { BearerGuard } from './modules/services/auth/bearer.guard';
import { MyJwtPayload } from './modules/services/auth/types';

@controller()
export class HelloWorldController {
  @route('GET')
  async getToken(res: Res) {
    res.send('Hello World!\n');
  }

  @route('GET', 'profile', [BearerGuard])
  async getProfile(@inject(JwtPayload) jwtPayload: MyJwtPayload, res: Res) {
    res.send(`Hello, ${jwtPayload.userName}! You have successfully authorized.`);
  }
}
