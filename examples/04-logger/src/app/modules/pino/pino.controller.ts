import { inject, Logger } from '@ditsmod/core';
import { controller, route, RequestContext } from '@ditsmod/rest';
import { BaseLogger as PinoLogger } from 'pino';

@controller()
export class PinoController {
  @route('GET', 'pino')
  async ok(reqCtx: RequestContext, @inject(Logger) logger: PinoLogger) {
    reqCtx.send('see console of node process\n');
    logger.info("it's works!");
  }
}
