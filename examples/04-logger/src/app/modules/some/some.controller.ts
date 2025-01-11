import { Logger } from '@ditsmod/core';
import { controller, route, Res } from '@ditsmod/routing';

@controller()
export class SomeController {
  @route('GET')
  async ok(res: Res, logger: Logger) {
    res.send('ok');
    logger.log('info', "it's works!");
  }
}
