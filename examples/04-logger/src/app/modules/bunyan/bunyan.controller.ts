import { RequestContext, controller, route } from '@ditsmod/rest';
import BunyanLogger from 'bunyan';

@controller()
export class BunyanController {
  @route('GET', 'bunyan')
  async ok(ctx: RequestContext, logger: BunyanLogger) {
    ctx.send('see console of node process\n');
    logger.info("it's works!");
  }
}
