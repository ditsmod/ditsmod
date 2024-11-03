import { controller, Res, route, SingletonRequestContext } from '@ditsmod/core';

@controller()
export class SecondController {
  @route('GET', 'second')
  async method1(res: Res) {
    res.send('default send');
  }

  @route('GET', 'second-json')
  async method2() {
    return { msg: 'JSON object' };
  }

  @route('GET', 'second-string')
  async method3() {
    return 'Some string';
  }
}

@controller({ singleton: 'module' })
export class SecondSingletonController {
  @route('GET', 'second2')
  async method1(ctx: SingletonRequestContext) {
    ctx.send('default2 send');
  }

  @route('GET', 'second2-json')
  async method2() {
    return { msg: 'JSON2 object' };
  }

  @route('GET', 'second2-string')
  async method3() {
    return 'Some2 string';
  }
}
