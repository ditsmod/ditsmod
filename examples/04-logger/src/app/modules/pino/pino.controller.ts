import { inject, Logger } from '@ditsmod/core';
import { controller, route, Res } from '@ditsmod/rest';
import { BaseLogger as PinoLogger } from 'pino';

@controller()
export class PinoController {
  @route('GET', 'pino')
  async ok(res: Res, @inject(Logger) logger: PinoLogger) {
    res.send('see console of node process\n');
    logger.info("it's works!");
  }
}
