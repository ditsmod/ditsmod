import { Context } from './context.js';
import { factoryMethod, injCtx } from './decorators.js';
import { Injector } from './injector.js';
import { injectorCtxProviders } from './providers.js';

describe('Context', () => {
  it('case1', () => {
    class Service1 {
      @factoryMethod()
      method1(@injCtx('token1') param1: any, @injCtx('token2') param2: any) {
        return { param1, param2 };
      }
    }
    const injectorPerApp = Injector.resolveAndCreate([...injectorCtxProviders], 'App');
    const injectorPerMod = injectorPerApp.resolveAndCreateChild([...injectorCtxProviders], 'Mod');
    const injectorPerRou = injectorPerMod.resolveAndCreateChild(
      [...injectorCtxProviders, { useFactory: [Service1, Service1.prototype.method1] }],
      'Rou',
    );
    const ctx = injectorPerRou.get(Context) as Context;
    ctx.set('token1', 'value1');
    ctx.set('token2', 'value2');
    expect(injectorPerRou.get(Service1.prototype.method1)).toEqual({ param1: 'value1', param2: 'value2' });
  });
});
