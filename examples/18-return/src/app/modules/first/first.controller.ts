import { controller, Res } from '@ditsmod/core';
import { route } from '@ditsmod/routing';

@controller()
export class FirstController {
  @route('GET', 'first')
  tellHello(res: Res) {
    res.send('first module.\n');
  }

  @route('GET', 'first-return')
  tellHelloWithReturn() {
    // This method not works because in this module not imported ReturnModule
    return 'first module.\n';
  }
}
