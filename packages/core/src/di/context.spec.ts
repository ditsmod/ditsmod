import { factoryMethod } from './decorators.js';
import { ctx } from './ctx/decorators.js';
import { Injector } from './injector.js';
import { injectorCtxProviders } from './ctx/providers.js';
import { Context } from './ctx/context.js';

describe('Context', () => {
  it('case1', () => {
    class Service1 {
      @factoryMethod()
      method1(@ctx('token1') param1: any, @ctx('token2') param2: any) {
        return { param1, param2 };
      }
    }
    const injectorPerApp = Injector.resolveAndCreate([...injectorCtxProviders], 'App');
    const injectorPerMod = injectorPerApp.resolveAndCreateChild([...injectorCtxProviders], 'Mod');
    const injectorPerRou = injectorPerMod.resolveAndCreateChild(
      [...injectorCtxProviders, { useFactory: [Service1, Service1.prototype.method1] }],
      'Rou',
    );
    const context = injectorPerRou.get(Context) as Context;
    context.set('token1', 'value1');
    context.set('token2', 'value2');
    expect(injectorPerRou.get(Service1.prototype.method1)).toEqual({ param1: 'value1', param2: 'value2' });
  });
});
