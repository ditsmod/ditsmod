import { RequestContext, controller, route } from '@ditsmod/rest';
import { CorsService } from '@ditsmod/cors';

@controller()
export class FirstController {
  @route('GET')
  getMethod(ctx: RequestContext) {
    ctx.send('GET method\n');
  }

  @route('POST')
  postMethod(ctx: RequestContext) {
    ctx.send('POST method\n');
  }

  @route('PATCH')
  patchMethod(ctx: RequestContext) {
    ctx.send('PATCH method\n');
  }
}

@controller()
export class SecondController {
  constructor(private corsService: CorsService) {}

  @route('GET', 'credentials')
  getMethod(ctx: RequestContext) {
    this.corsService.setCookie('one', 'value for one');
    ctx.send('Here GET request with "Access-Control-Allow-Credentials: true" header.\n');
  }
}
