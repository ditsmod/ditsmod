import { inject, controller, Res, route, Logger } from '@ditsmod/core';
import { Logger as WinstonLogger } from 'winston';

@controller()
export class WinstonController {
  constructor(private res: Res, @inject(Logger) private logger: WinstonLogger) {}

  @route('GET', 'winston')
  ok() {
    this.res.send('see console of node process\n');
    this.logger.info("it's works!");
  }
}
