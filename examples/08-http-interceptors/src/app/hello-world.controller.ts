import { controller, Res, route } from '@ditsmod/core';

@controller()
export class HelloWorldController {
  constructor(private res: Res) {}

  @route('GET')
  tellHello() {
    this.res.send('Hello World!\n');
  }

  @route('GET', 'throw-error')
  throwError() {
    throw new Error('some error here!');
  }
}
