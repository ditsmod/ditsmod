import { Controller, Req, Res, Route } from '@ditsmod/core';
import { JwtService } from '@ditsmod/jwt';

@Controller()
export class AuthController {
  constructor(private req: Req, private res: Res, private jwtService: JwtService) {}

  @Route('GET', 'get-token-for/:userName')
  async getToken() {
    const token = await this.jwtService.signWithSecret({ userName: this.req.pathParams.userName });
    this.res.send(token);
  }
}
