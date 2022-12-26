import { controller, Res, route } from '@ditsmod/core';

@controller()
export class FirstController {
  constructor(private res: Res) {}

  @route('GET', 'first')
  tellHello() {
    this.res.send('first module.\n');
  }

  @route('GET', 'first-return')
  tellHelloWithReturn() {
    // This method not works because in this module not imported ReturnModule
    return 'first module.\n';
  }
}
