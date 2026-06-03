import { inject, Logger } from '@ditsmod/core';
import { controller, route, RequestContext } from '@ditsmod/rest';
import { Logger as WinstonLogger } from 'winston';

@controller()
export class WinstonController {
  @route('GET', 'winston')
  async ok(ctx: RequestContext, @inject(Logger) logger: WinstonLogger) {
    ctx.send('see console of node process\n');
    logger.info("it's works!");
  }
}
