import { RequestContext, controller, route } from '@ditsmod/rest';
import { CorsService } from '@ditsmod/cors';

@controller()
export class FirstController {
  @route('GET')
  getMethod(reqCtx: RequestContext) {
    reqCtx.send('GET method\n');
  }

  @route('POST')
  postMethod(reqCtx: RequestContext) {
    reqCtx.send('POST method\n');
  }

  @route('PATCH')
  patchMethod(reqCtx: RequestContext) {
    reqCtx.send('PATCH method\n');
  }
}

@controller()
export class SecondController {
  constructor(private corsService: CorsService) {}

  @route('GET', 'credentials')
  getMethod(reqCtx: RequestContext) {
    this.corsService.setCookie('one', 'value for one');
    reqCtx.send('Here GET request with "Access-Control-Allow-Credentials: true" header.\n');
  }
}
