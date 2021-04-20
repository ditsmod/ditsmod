import { Controller, Response, Route } from '@ditsmod/core';

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
