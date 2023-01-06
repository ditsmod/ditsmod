import { controller, RequestContext, Res, route } from '@ditsmod/core';
import { CorsService } from '@ditsmod/cors';

@controller()
export class FirstController {
  @route('GET')
  getMethod(ctx: RequestContext) {
    ctx.res.send('GET method\n');
  }

  @route('POST')
  postMethod(ctx: RequestContext) {
    ctx.res.send('POST method\n');
  }

  @route('PATCH')
  patchMethod(ctx: RequestContext) {
    ctx.res.send('PATCH method\n');
  }
}

@controller()
export class SecondController {
  constructor(private corsService: CorsService) {}

  @route('GET', 'credentials')
  getMethod(ctx: RequestContext) {
    this.corsService.setCookie(ctx, 'one', 'value for one');
    ctx.res.send('Here GET request with "Access-Control-Allow-Credentials: true" header.\n');
  }
}
