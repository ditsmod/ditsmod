import { AnyObj, ctx } from '@holu/core';
import { controller, route, PATH_PARAMS, RequestContext } from '@holu/rest';
import { JwtService } from '@holu/jwt';

@controller()
export class AuthController {
  constructor(private jwtService: JwtService) {}

  @route('GET', 'get-token-for/:userName')
  async getToken(@ctx(PATH_PARAMS) pathParams: AnyObj, ctx: RequestContext) {
    const token = await this.jwtService.signWithSecret({ userName: pathParams.userName });
    ctx.send(token);
  }
}
