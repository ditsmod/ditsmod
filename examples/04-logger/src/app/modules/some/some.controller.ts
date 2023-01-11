import { controller, Logger, Res, route } from '@ditsmod/core';

@controller()
export class SomeController {
  constructor(private logger: Logger) {}

  @route('GET')
  ok(res: Res) {
    res.send('ok');
    this.logger.info("it's works!");
  }
}
