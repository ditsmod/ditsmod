import { Controller, Res, Route } from '@ditsmod/core';

@Controller()
export class HelloWorldController {
  constructor(private res: Res) {}

  @Route('OPTIONS')
  tellHello() {
    this.res.send('Hello World!\n');
  }
}
