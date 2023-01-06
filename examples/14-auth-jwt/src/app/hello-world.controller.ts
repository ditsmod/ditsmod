import { controller, RequestContext, route } from '@ditsmod/core';

import { BearerGuard } from './modules/services/auth/bearer.guard';
import { MyJwtPayload } from './modules/services/auth/types';

@controller()
export class HelloWorldController {
  @route('GET')
  async getToken(ctx: RequestContext) {
    ctx.res.send('Hello World!\n');
  }

  @route('GET', 'profile', [BearerGuard])
  async getProfile(ctx: RequestContext) {
    const payload: MyJwtPayload = ctx.req.jwtPayload;
    ctx.res.send(`Hello, ${payload.userName}! You have successfully authorized.`);
  }
}
