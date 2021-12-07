import { Controller, Res, Route, Logger } from '@ditsmod/core';

@Controller()
export class PinoController {
  constructor(private res: Res, private logger: Logger) {}

  @Route('GET', 'pino')
  ok() {
    this.res.send('see console of node process\n');
    this.logger.info("it's works!");
  }
}
