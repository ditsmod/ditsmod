import { controller, Req, Res, route } from '@ditsmod/core';

import { BearerGuard } from './modules/services/auth/bearer.guard';
import { MyJwtPayload } from './modules/services/auth/types';

@controller()
export class HelloWorldController {
  @route('GET')
  async getToken(res: Res) {
    res.send('Hello World!\n');
  }

  @route('GET', 'profile', [BearerGuard])
  async getProfile(req: Req, res: Res) {
    const payload: MyJwtPayload = req.jwtPayload;
    res.send(`Hello, ${payload.userName}! You have successfully authorized.`);
  }
}
