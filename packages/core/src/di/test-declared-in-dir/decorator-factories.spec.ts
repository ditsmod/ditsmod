import 'reflect-metadata/lite';
import { makeClassDecorator, makeParamDecorator, makePropDecorator } from '../decorator-factories.js';
import { Reflector } from '#di/reflector.js';

fdescribe('persistent debug name of decorator factory', () => {
  it('for makeClassDecorator', () => {
    const classDecorator = makeClassDecorator((...args) => args);
    @classDecorator('one')
    class Class1 {}

    // console.log(Reflector.getClassRawMeta(Class1));
    // expect(classDecorator.name).toBe('classDecorator1');
  });
});

describe('persistent debug name of decorator factory', () => {
  it('for makeClassDecorator', () => {
    const decorator = makeClassDecorator(undefined, 'classDecorator1');
    expect(decorator.name).toBe('classDecorator1');
  });
  it('for makeParamDecorator', () => {
    const decorator = makeParamDecorator(undefined, 'classDecorator2');
    expect(decorator.name).toBe('classDecorator2');
  });
  it('for makePropDecorator', () => {
    const decorator = makePropDecorator(undefined, 'classDecorator3');
    expect(decorator.name).toBe('classDecorator3');
  });
});
