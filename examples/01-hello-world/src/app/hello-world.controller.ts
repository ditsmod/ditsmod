import { controller, Res, route } from '@ditsmod/core';

@controller()
export class HelloWorldController {
  constructor(private res: Res) {}

  @route('GET')
  tellHello() {
    this.res.send('Hello World!');
  }
}
