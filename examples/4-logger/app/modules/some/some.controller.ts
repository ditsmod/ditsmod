import { Controller, Logger, Response, Route } from '@ditsmod/core';

@Controller()
export class SomeController {
  constructor(private res: Response, private logger: Logger) {}

  @Route('GET')
  ok() {
    this.res.send('ok');
    this.logger.info("it's works!");
  }
}
