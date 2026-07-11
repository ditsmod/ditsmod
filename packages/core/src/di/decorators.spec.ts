import { Reflector } from './reflector.js';
import { DecoratorMeta } from './top/decorator-and-value.js';
import { ctx } from '#ctx/decorators.js';
import { Injector } from './injector.js';
import { contextProviders } from '#ctx/providers.js';
import { Context } from '#ctx/context.js';
import { classMetaMap } from './reflector-helpers.js';

class DecoratedParent {}
class DecoratedChild extends DecoratedParent {}

const testDecorator = Reflector.makeClassDecorator((data: any) => data);

describe('Property decorators', () => {
  // https://github.com/angular/angular/issues/12224
  it('should work on the "watch" property', () => {
    const prop = Reflector.makePropDecorator((value: any) => value);

    class TestClass {
      @prop('firefox!')
      watch: any;
    }

    const p = Reflector.collectMeta(TestClass)!;
    expect(p.watch.type).toBe(Object);
    expect(p.watch.decorators).toEqual([new DecoratorMeta(prop, 'firefox!')]);
  });

  it('@ctx()', () => {
    class Service1 {
      method1(@ctx('token1') param1: any, @ctx('token2') param2: any) {
        return { param1, param2 };
      }
    }

    const injector = Injector.resolveAndCreate([
      ...contextProviders,
      { token: 'token3', useFactory: [Service1, Service1.prototype.method1] },
    ]);

    const context = injector.get(Context) as Context;
    context.set('token1', 1);
    context.set('token2', 2);
    expect(injector.get('token3')).toEqual({ param1: 1, param2: 2 });
  });

  // it('should work with any default plain values', () => {
  //   const propDecor = makePropDecorator((data: any) => ({ value: data != null ? data : 5 }));
  //   class A {
  //     prop1: number;
  //   };
  //   propDecor(0)(A, 'prop1');
  //   console.log(Reflect.getOwnMetadata(PROP_KEY, A, 'prop1'));
  //   // expect(propDecor(0)(fn, 'prop1')).toEqual(0);
  // });

  // it('should work with any object values', () => {
  //   // make sure we don't walk up the prototype chain
  //   const propDecor = makePropDecorator((data: any) => ({ value: 5, ...data }));
  //   const value = Object.create({ value: 10 });
  //   expect(new propDecor(value).value).toEqual(5);
  // });
});

describe('decorators', () => {
  it('should invoke as decorator', () => {
    class Class {}
    testDecorator({ marker: 'WORKS' })(Class);
    const annotations = classMetaMap.get(Class) as DecoratorMeta[];
    expect(annotations[0].value.marker).toEqual('WORKS');
  });

  it('should not apply decorators from the prototype chain', () => {
    testDecorator({ marker: 'parent' })(DecoratedParent);
    testDecorator({ marker: 'child' })(DecoratedChild);

    const annotations = classMetaMap.get(DecoratedChild) as DecoratorMeta[];
    expect(annotations.length).toBe(1);
    expect(annotations[0].value.marker).toEqual('child');
  });
});
