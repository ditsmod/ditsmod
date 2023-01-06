import { inject, controller, route, Logger, RequestContext } from '@ditsmod/core';
import { Logger as WinstonLogger } from 'winston';

@controller()
export class WinstonController {
  constructor(@inject(Logger) private logger: WinstonLogger) {}

  @route('GET', 'winston')
  ok(ctx: RequestContext) {
    ctx.res.send('see console of node process\n');
    this.logger.info("it's works!");
  }
}
