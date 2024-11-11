import { inject, controller, Logger, Res } from '@ditsmod/core';
import { route } from '@ditsmod/routing';
import { BaseLogger as PinoLogger } from 'pino';

@controller()
export class PinoController {
  @route('GET', 'pino')
  async ok(res: Res, @inject(Logger) logger: PinoLogger) {
    res.send('see console of node process\n');
    logger.info("it's works!");
  }
}
