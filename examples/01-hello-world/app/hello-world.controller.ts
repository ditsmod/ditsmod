import { Controller, Response, Route } from '@ditsmod/core';

@Controller()
export class HelloWorldController {
  constructor(private res: Response) {}

  @Route('GET')
  tellHello() {
    this.res.send('Hello World!\n');
  }
}
