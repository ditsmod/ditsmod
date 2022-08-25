import { Controller, Res, Route } from '@ditsmod/core';

@Controller()
export class HelloWorldController {
  constructor(private res: Res) {}

  @Route('GET')
  tellHello() {
    this.res.send('Hello World!\n');
  }

  @Route('GET', 'throw-error')
  throwError() {
    throw new Error('some error here!');
  }
}
