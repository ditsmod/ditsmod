import { controller, Logger, Res, route } from '@ditsmod/core';

@controller()
export class SomeController {
  @route('GET')
  async ok(res: Res, logger: Logger) {
    res.send('ok');
    logger.log('info', "it's works!");
  }
}
