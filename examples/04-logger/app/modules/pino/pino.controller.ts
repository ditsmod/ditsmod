import { Controller, Res, Route, Logger } from '@ditsmod/core';
import { Inject } from '@ts-stack/di';
import { BaseLogger as PinoLogger } from 'pino';

@Controller()
export class PinoController {
  constructor(private res: Res, @Inject(Logger) private logger: PinoLogger) {}

  @Route('GET', 'pino')
  ok() {
    this.res.send('see console of node process\n');
    this.logger.info("it's works!");
  }
}
