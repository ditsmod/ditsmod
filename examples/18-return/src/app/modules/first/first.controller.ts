import { Controller, Res, Route } from '@ditsmod/core';

@Controller()
export class FirstController {
  constructor(private res: Res) {}

  @Route('GET', 'first')
  tellHello() {
    this.res.send('first module.\n');
  }

  @Route('GET', 'first-return')
  tellHelloWithReturn() {
    // This method not works because in this module not imported ReturnModule
    return 'first module.\n';
  }
}
