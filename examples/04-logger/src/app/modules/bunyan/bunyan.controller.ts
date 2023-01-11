import { controller, Res, route } from '@ditsmod/core';
import BunyanLogger from 'bunyan';

@controller()
export class BunyanController {
  constructor(private logger: BunyanLogger) {}

  @route('GET', 'bunyan')
  ok(res: Res) {
    res.send('see console of node process\n');
    this.logger.info("it's works!");
  }
}
