import { Controller, Res, Route } from '@ditsmod/core';

@Controller()
export class HelloWorldController {
  @Route('GET', 'json')
  async method1() {
    return { msg: 'JSON object' };
  }

  @Route('GET', 'string')
  async method2() {
    return 'Some string';
  }
}
