import { inject, controller, route, Logger, Res } from '@ditsmod/core';
import { BaseLogger as PinoLogger } from 'pino';

@controller()
export class PinoController {
  @route('GET', 'pino')
  async ok(res: Res, @inject(Logger) logger: PinoLogger) {
    res.send('see console of node process\n');
    logger.info("it's works!");
  }
}
