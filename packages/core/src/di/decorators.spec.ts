import 'reflect-metadata/lite';

import { CLASS_KEY, makeClassDecorator, makePropDecorator } from './decorator-factories.js';
import { reflector } from './reflection.js';
import { DecoratorAndValue } from './types-and-models.js';

class DecoratedParent {}
class DecoratedChild extends DecoratedParent {}

const testDecorator = makeClassDecorator((data: any) => data);

describe('Property decorators', () => {
  // https://github.com/angular/angular/issues/12224
  it('should work on the "watch" property', () => {
    const prop = makePropDecorator((value: any) => value);

    class TestClass {
      @prop('firefox!')
      watch: any;
    }

    const p = reflector.getMetadata(TestClass)!;
    expect(p.watch.type).toBe(Object);
    expect(p.watch.decorators).toEqual([new DecoratorAndValue(prop, 'firefox!')]);
  });
});

describe('decorators', () => {
  it('should invoke as decorator', () => {
    class Class {}
    testDecorator({ marker: 'WORKS' })(Class);
    const annotations = (Class as any)[CLASS_KEY] as DecoratorAndValue[];
    expect(annotations[0].value.marker).toEqual('WORKS');
  });

  it('should not apply decorators from the prototype chain', () => {
    testDecorator({ marker: 'parent' })(DecoratedParent);
    testDecorator({ marker: 'child' })(DecoratedChild);

    const annotations = (DecoratedChild as any)[CLASS_KEY] as DecoratorAndValue[];
    expect(annotations.length).toBe(1);
    expect(annotations[0].value.marker).toEqual('child');
  });
});
