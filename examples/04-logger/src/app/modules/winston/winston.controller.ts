import { inject, controller, Logger, Res } from '@ditsmod/core';
import { route } from '@ditsmod/routing';
import { Logger as WinstonLogger } from 'winston';

@controller()
export class WinstonController {
  @route('GET', 'winston')
  async ok(res: Res, @inject(Logger) logger: WinstonLogger) {
    res.send('see console of node process\n');
    logger.info("it's works!");
  }
}
