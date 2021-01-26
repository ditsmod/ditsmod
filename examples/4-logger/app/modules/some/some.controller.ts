import { Controller, Logger, Response, Route } from '@ts-stack/ditsmod';

@Controller()
export class SomeController {
  constructor(private res: Response, private log: Logger) {}

  @Route('GET')
  ok() {
    this.res.send('ok');
    this.log.trace('winston works!');
  }
}
