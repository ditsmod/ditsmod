import { inject, controller, route, Logger, RequestContext } from '@ditsmod/core';
import { BaseLogger as PinoLogger } from 'pino';

@controller()
export class PinoController {
  constructor(@inject(Logger) private logger: PinoLogger) {}

  @route('GET', 'pino')
  ok(ctx: RequestContext) {
    ctx.res.send('see console of node process\n');
    this.logger.info("it's works!");
  }
}
