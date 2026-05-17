import 'reflect-metadata/lite';
import { Reflector } from '#di/reflector.js';
import { reflector } from '#di/reflection.js';

fdescribe('persistent debug name of decorator factory', () => {
  it('for makeClassDecorator', () => {
    const classDecoratorFactory = Reflector.makeClassDecorator((...args) => args);
    // @classDecorator('one')
    const SomeClass = class {};
    Reflector.setClassRawMeta(SomeClass, classDecoratorFactory({ one: 1 }));

    console.log(reflector.getMetadata(SomeClass)?.constructor.decorators);
    console.log(Reflector.getClassRawMeta(SomeClass));
    // expect(classDecorator.name).toBe('classDecorator1');
  });
});

describe('persistent debug name of decorator factory', () => {
  it('for makeClassDecorator', () => {
    const decorator = Reflector.makeClassDecorator(undefined, 'classDecorator1');
    expect(decorator.name).toBe('classDecorator1');
  });
  it('for makeParamDecorator', () => {
    const decorator = Reflector.makeParamDecorator(undefined, 'classDecorator2');
    expect(decorator.name).toBe('classDecorator2');
  });
  it('for makePropDecorator', () => {
    const decorator = Reflector.makePropDecorator(undefined, 'classDecorator3');
    expect(decorator.name).toBe('classDecorator3');
  });
});
