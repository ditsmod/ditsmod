import { Controller, Response, Route, Logger } from '@ts-stack/ditsmod';

@Controller()
export class BunyanController {
  constructor(private res: Response, private log: Logger) {}

  @Route('GET', 'bunyan')
  ok() {
    this.res.send('see console of node process\n');
    this.log.trace(`it's works!`);
  }
}
