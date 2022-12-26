import { controller, Res, route } from '@ditsmod/core';

@controller()
export class SomeController {
  constructor(private res: Res) {}

  @route('GET')
  ok() {
    this.res.send('ok');
  }

  @route('GET', 'throw-error')
  throwError() {
    throw new Error('Here some error occurred');
  }
}
