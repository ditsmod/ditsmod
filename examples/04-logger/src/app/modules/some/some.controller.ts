import { Controller, Logger, Res, Route } from '@ditsmod/core';

@Controller()
export class SomeController {
  constructor(private res: Res, private logger: Logger) {}

  @Route('GET')
  ok() {
    this.res.send('ok');
    this.logger.info("it's works!");
  }
}
