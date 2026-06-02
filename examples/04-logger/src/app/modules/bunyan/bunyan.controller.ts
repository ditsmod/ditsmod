import { RequestContext, controller, route } from '@ditsmod/rest';
import BunyanLogger from 'bunyan';

@controller()
export class BunyanController {
  @route('GET', 'bunyan')
  async ok(reqCtx: RequestContext, logger: BunyanLogger) {
    reqCtx.send('see console of node process\n');
    logger.info("it's works!");
  }
}
