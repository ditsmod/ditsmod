import { AnyObj, ctx } from '@ditsmod/core';
import { controller, route, PATH_PARAMS, RequestContext } from '@ditsmod/rest';
import { JwtService } from '@ditsmod/jwt';

@controller()
export class AuthController {
  constructor(private jwtService: JwtService) {}

  @route('GET', 'get-token-for/:userName')
  async getToken(@ctx(PATH_PARAMS) pathParams: AnyObj, reqCtx: RequestContext) {
    const token = await this.jwtService.signWithSecret({ userName: pathParams.userName });
    reqCtx.send(token);
  }
}
