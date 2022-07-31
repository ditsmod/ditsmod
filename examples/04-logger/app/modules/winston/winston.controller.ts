import { Controller, Res, Route, Logger } from '@ditsmod/core';
import { Logger as WinstonLogger } from 'winston';
import { Inject } from '@ts-stack/di';

@Controller()
export class WinstonController {
  constructor(private res: Res, @Inject(Logger) private logger: WinstonLogger) {}

  @Route('GET', 'winston')
  ok() {
    this.res.send('see console of node process\n');
    this.logger.info("it's works!");
  }
}
