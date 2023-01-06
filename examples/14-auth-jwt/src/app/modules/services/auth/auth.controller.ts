import { controller, RequestContext, route } from '@ditsmod/core';
import { JwtService } from '@ditsmod/jwt';

@controller()
export class AuthController {
  constructor(private jwtService: JwtService) {}

  @route('GET', 'get-token-for/:userName')
  async getToken(ctx: RequestContext) {
    const token = await this.jwtService.signWithSecret({ userName: ctx.req.pathParams.userName });
    ctx.res.send(token);
  }
}
