import { Controller, Response, Route } from '@ts-stack/ditsmod';

@Controller()
export class SomeController {
  constructor(private res: Response) {}

  @Route('GET')
  ok() {
    this.res.send('ok');
  }

  @Route('GET', 'throw-error')
  throwError() {
    throw new Error('Here some error occurred');
  }
}
