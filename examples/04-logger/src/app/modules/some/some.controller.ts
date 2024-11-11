import { controller, Logger, Res } from '@ditsmod/core';
import { route } from '@ditsmod/routing';

@controller()
export class SomeController {
  @route('GET')
  async ok(res: Res, logger: Logger) {
    res.send('ok');
    logger.log('info', "it's works!");
  }
}
