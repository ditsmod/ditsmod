import { Logger } from '@ditsmod/core';
import { controller, route, RequestContext } from '@ditsmod/rest';

@controller()
export class SomeController {
  @route('GET')
  async ok(reqCtx: RequestContext, logger: Logger) {
    reqCtx.send('ok');
    logger.log('info', "it's works!");
  }
}
