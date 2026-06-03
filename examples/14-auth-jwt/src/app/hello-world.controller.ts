import { ctx } from '@ditsmod/core';
import { controller, route, RequestContext } from '@ditsmod/rest';
import { JWT_PAYLOAD } from '@ditsmod/jwt';

import { BearerGuard } from './modules/services/auth/bearer.guard.js';
import { MyJwtPayload } from './modules/services/auth/types.js';

@controller()
export class HelloWorldController {
  @route('GET')
  async getToken(ctx: RequestContext) {
    ctx.send('Hello, World!\n');
  }

  @route('GET', 'profile', [BearerGuard])
  async getProfile(@ctx(JWT_PAYLOAD) jwtPayload: MyJwtPayload, ctx: RequestContext) {
    ctx.send(`Hello, ${jwtPayload.userName}! You have successfully authorized.`);
  }
}
