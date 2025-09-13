import { makeClassDecorator, reflector, Expect, Equal } from '#di';
import { AnyFn } from '#types/mix.js';

describe('makeClassDecorator', () => {
  describe('appliedTo', () => {
    interface ValueOfDecorator {
      one: string;
    }
    const decorator1 = makeClassDecorator<AnyFn, ValueOfDecorator>();
    const decorator2 = makeClassDecorator(undefined, decorator1);
    const decorator3 = makeClassDecorator();

    @decorator1()
    class Class1 {}

    @decorator2()
    class Class2 {}

    @decorator3()
    class Class3 {}

    const metadata1 = reflector.getDecorators(Class1)![0];
    const metadata2 = reflector.getDecorators(Class2)![0];
    const metadata3 = reflector.getDecorators(Class3)![0];

    test('decorator1 recognizes its own metadata', () => {
      expect(decorator1.appliedTo(metadata1)).toBe(true);
      if (decorator1.appliedTo(metadata1)) {
        // check type only
        type Tmp1 = Expect<Equal<typeof metadata1.value, ValueOfDecorator>>;
      }
    });

    test('decorator1 recognizes metadata of decorator2 (from child decorator)', () => {
      expect(decorator1.appliedTo(metadata2)).toBe(true);
    });

    test('decorator2 recognizes its own metadata', () => {
      expect(decorator2.appliedTo(metadata2)).toBe(true);
    });

    test('decorator2 recognizes metadata of decorator1 (from parent decorator)', () => {
      expect(decorator2.appliedTo(metadata1)).toBe(true);
    });

    test('decorator1 is not recognizes metadata of decorator3', () => {
      expect(decorator1.appliedTo(metadata3)).toBe(false);
    });

    test('decorator2 not recognizes metadata of decorator3', () => {
      expect(decorator2.appliedTo(metadata3)).toBe(false);
    });
  });

  test('persistent debug name of decorator factory', () => {
    const classDecorator = makeClassDecorator(undefined, undefined, 'classDecorator');
    expect(classDecorator.name).toBe('classDecorator');
  });
});
