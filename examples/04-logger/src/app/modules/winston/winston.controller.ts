import { inject, controller, route, Logger, Res } from '@ditsmod/core';
import { Logger as WinstonLogger } from 'winston';

@controller()
export class WinstonController {
  constructor(@inject(Logger) private logger: WinstonLogger) {}

  @route('GET', 'winston')
  ok(res: Res) {
    res.send('see console of node process\n');
    this.logger.info("it's works!");
  }
}
