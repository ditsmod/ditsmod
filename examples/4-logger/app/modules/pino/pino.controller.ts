import { Controller, Response, Route, Logger } from '@ts-stack/ditsmod';

@Controller()
export class PinoController {
  constructor(private res: Response, private log: Logger) {}

  @Route('GET', 'pino')
  ok() {
    this.res.send('see console of node process\n');
    this.log.info("it's works!");
  }
}
