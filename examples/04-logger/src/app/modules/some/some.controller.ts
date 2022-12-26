import { controller, Logger, Res, route } from '@ditsmod/core';

@controller()
export class SomeController {
  constructor(private res: Res, private logger: Logger) {}

  @route('GET')
  ok() {
    this.res.send('ok');
    this.logger.info("it's works!");
  }
}
