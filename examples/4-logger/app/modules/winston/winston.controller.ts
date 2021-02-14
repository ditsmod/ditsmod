import { Controller, Response, Route, Logger } from '@ts-stack/ditsmod';

@Controller()
export class WinstonController {
  constructor(private res: Response, private log: Logger) {}

  @Route('GET', 'winston')
  ok() {
    this.res.send('see console of node process\n');
    this.log.trace("it's works!");
  }
}
