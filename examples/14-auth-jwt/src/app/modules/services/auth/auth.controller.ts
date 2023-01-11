import { controller, Req, Res, route } from '@ditsmod/core';
import { JwtService } from '@ditsmod/jwt';

@controller()
export class AuthController {
  constructor(private jwtService: JwtService) {}

  @route('GET', 'get-token-for/:userName')
  async getToken(req: Req, res: Res) {
    const token = await this.jwtService.signWithSecret({ userName: req.pathParams.userName });
    res.send(token);
  }
}
