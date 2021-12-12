import { Controller, Res, Route } from '@ditsmod/core';
import { JwtService } from '@ditsmod/jwt';

@Controller()
export class AuthController {
  constructor(private res: Res, private jwtService: JwtService) {}

  @Route('GET')
  async getToken() {
    const token = await this.jwtService.signWithSecret({ one: 1 });
    this.res.send(token);
  }
}
