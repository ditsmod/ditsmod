import { Controller, Res, Route } from '@ditsmod/core';
import BunyanLogger from 'bunyan';

@Controller()
export class BunyanController {
  constructor(private res: Res, private logger: BunyanLogger) {}

  @Route('GET', 'bunyan')
  ok() {
    this.res.send('see console of node process\n');
    this.logger.info("it's works!");
  }
}
