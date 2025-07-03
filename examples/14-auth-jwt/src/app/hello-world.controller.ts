import { inject } from '@ditsmod/core';
import { controller, route, Res } from '@ditsmod/rest';
import { JWT_PAYLOAD } from '@ditsmod/jwt';

import { BearerGuard } from './modules/services/auth/bearer.guard.js';
import { MyJwtPayload } from './modules/services/auth/types.js';

@controller()
export class HelloWorldController {
  @route('GET')
  async getToken(res: Res) {
    res.send('Hello, World!\n');
  }

  @route('GET', 'profile', [BearerGuard])
  async getProfile(@inject(JWT_PAYLOAD) jwtPayload: MyJwtPayload, res: Res) {
    res.send(`Hello, ${jwtPayload.userName}! You have successfully authorized.`);
  }
}
