import { Controller, Res, Route } from '@ditsmod/core';

@Controller()
export class SecondController {
  constructor(private res: Res) {}

  @Route('GET', 'second')
  async method1() {
    this.res.send('default send');
  }

  @Route('GET', 'second-json')
  async method2() {
    return { msg: 'JSON object' };
  }

  @Route('GET', 'second-string')
  async method3() {
    return 'Some string';
  }
}
