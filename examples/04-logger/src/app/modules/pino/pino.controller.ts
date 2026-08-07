import { inject, Logger } from '@holu/core';
import { controller, route, RequestContext } from '@holu/rest';
import { BaseLogger as PinoLogger } from 'pino';

@controller()
export class PinoController {
  @route('GET', 'pino')
  async ok(ctx: RequestContext, @inject(Logger) logger: PinoLogger) {
    ctx.send('see console of node process\n');
    logger.info("it's works!");
  }
}
