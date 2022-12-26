import { controller, Res, route } from '@ditsmod/core';
import { CorsService } from '@ditsmod/cors';

@controller()
export class FirstController {
  constructor(private res: Res) {}

  @route('GET')
  getMethod() {
    this.res.send('GET method\n');
  }

  @route('POST')
  postMethod() {
    this.res.send('POST method\n');
  }

  @route('PATCH')
  patchMethod() {
    this.res.send('PATCH method\n');
  }
}

@controller()
export class SecondController {
  constructor(private res: Res, private corsService: CorsService) {}

  @route('GET', 'credentials')
  getMethod() {
    this.corsService.setCookie('one', 'value for one');
    this.res.send('Here GET request with "Access-Control-Allow-Credentials: true" header.\n');
  }
}
