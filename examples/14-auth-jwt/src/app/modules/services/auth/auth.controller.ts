import { controller, Req, Res, route } from '@ditsmod/core';
import { JwtService } from '@ditsmod/jwt';

@controller()
export class AuthController {
  constructor(private req: Req, private res: Res, private jwtService: JwtService) {}

  @route('GET', 'get-token-for/:userName')
  async getToken() {
    const token = await this.jwtService.signWithSecret({ userName: this.req.pathParams.userName });
    this.res.send(token);
  }
}
