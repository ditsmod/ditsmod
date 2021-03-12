import { Controller, Logger, Response, Route } from '@ditsmod/core';

@Controller()
export class SomeController {
  constructor(private res: Response, private log: Logger) {}

  @Route('GET')
  ok() {
    this.res.send('ok');
    this.log.info("it's works!");
  }
}
