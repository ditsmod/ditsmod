import { controller, RequestContext, Res, route } from '@ditsmod/core';
import { CorsService } from '@ditsmod/cors';

@controller()
export class FirstController {
  @route('GET')
  getMethod(res: Res) {
    res.send('GET method\n');
  }

  @route('POST')
  postMethod(res: Res) {
    res.send('POST method\n');
  }

  @route('PATCH')
  patchMethod(res: Res) {
    res.send('PATCH method\n');
  }
}

@controller()
export class SecondController {
  constructor(private corsService: CorsService) {}

  @route('GET', 'credentials')
  getMethod(res: Res, ctx: RequestContext) {
    this.corsService.setCookie(ctx, 'one', 'value for one');
    res.send('Here GET request with "Access-Control-Allow-Credentials: true" header.\n');
  }
}
