import { controller, Res, route } from '@ditsmod/core';

@controller()
export class SomeController {
  @route('GET')
  ok(res: Res) {
    res.send('ok');
  }

  @route('GET', 'throw-error')
  throwError() {
    throw new Error('Here some error occurred');
  }
}
