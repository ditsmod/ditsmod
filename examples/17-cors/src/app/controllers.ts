import { Controller, Res, Route } from '@ditsmod/core';
import { CorsService } from '@ditsmod/cors';

@Controller()
export class FirstController {
  constructor(private res: Res) {}

  @Route('GET')
  getMethod() {
    this.res.send('GET method\n');
  }

  @Route('POST')
  postMethod() {
    this.res.send('POST method\n');
  }

  @Route('PATCH')
  patchMethod() {
    this.res.send('PATCH method\n');
  }
}

@Controller()
export class SecondController {
  constructor(private res: Res, private corsService: CorsService) {}

  @Route('GET', 'credentials')
  getMethod() {
    this.corsService.setCookie('one', 'value for one');
    this.res.send('Here GET request with "Access-Control-Allow-Credentials: true" header.\n');
  }
}
