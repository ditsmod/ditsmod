import { factoryMethod, fromSelf } from '#di/decorators.js';
import { Injector } from '#di/injector.js';
import { ctx } from './decorators.js';
import { ctxProviders } from './providers.js';
import { Context } from './context.js';

describe('Context', () => {
  it('from current injector', () => {
    class Service1 {
      @factoryMethod()
      method1(@ctx('token1') param1: any, @ctx('token2') param2: any) {
        return { param1, param2 };
      }
    }
    const injector = Injector.resolveAndCreate(
      [...ctxProviders, { useFactory: [Service1, Service1.prototype.method1] }],
      'App',
    );
    const context = injector.get(Context) as Context;
    context.set('token1', 'value1');
    context.set('token2', 'value2');
    expect(injector.get(Service1.prototype.method1)).toEqual({ param1: 'value1', param2: 'value2' });
  });

  it('from parent injector', () => {
    class Service1 {
      @factoryMethod()
      method1(@ctx('token1') param1: any, @ctx('token2') param2: any, @ctx('token3') param3: any) {
        return { param1, param2, param3 };
      }
    }
    const injectorPerApp = Injector.resolveAndCreate([...ctxProviders], 'App');
    const injectorPerMod = injectorPerApp.resolveAndCreateChild([...ctxProviders], 'Mod');
    const injectorPerRou = injectorPerMod.resolveAndCreateChild(
      [...ctxProviders, { useFactory: [Service1, Service1.prototype.method1] }],
      'Rou',
    );
    const contextPerApp = injectorPerApp.get(Context) as Context;
    const contextPerMod = injectorPerMod.get(Context, undefined, undefined, fromSelf) as Context;
    const contextPerRou = injectorPerRou.get(Context, undefined, undefined, fromSelf) as Context;
    contextPerApp.set('token1', 'value1');
    contextPerMod.set('token2', 'value2');
    contextPerRou.set('token3', 'value3');
    expect(injectorPerRou.get(Service1.prototype.method1)).toEqual({
      param1: 'value1',
      param2: 'value2',
      param3: 'value3',
    });
  });
});
