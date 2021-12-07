import { Controller, Res, Route, Logger } from '@ditsmod/core';

@Controller()
export class BunyanController {
  constructor(private res: Res, private logger: Logger) {}

  @Route('GET', 'bunyan')
  ok() {
    this.res.send('see console of node process\n');
    this.logger.info("it's works!");
  }
}
