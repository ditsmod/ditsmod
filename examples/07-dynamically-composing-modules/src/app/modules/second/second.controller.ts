import { Controller, Res, Route } from '@ditsmod/core';

@Controller()
export class SecondController {
  constructor(private res: Res) {}

  @Route('GET', 'get-2')
  async tellHello() {
    this.res.send('second module.\n');
  }
}
