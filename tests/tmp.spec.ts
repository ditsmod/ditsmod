import 'reflect-metadata';
import { Injectable, Self, ReflectiveInjector, SkipSelf } from 'ts-di';

describe('depedency resolution', () => {
  class Engine {}

  class TurboEngine extends Engine {}

  @Injectable()
  class Car {
    constructor(public engine: Engine) {}
  }

  describe('@Self()', () => {
    it('should return a dependency from self', () => {
      const injector = ReflectiveInjector.resolveAndCreate([Engine, Car]);

      const car: Car = injector.get(Car);
      expect(car instanceof Car).toBe(true);
      expect(car.engine instanceof Engine).toBe(true);

      const child1 = injector.resolveAndCreateChild([
        // { provide: Car, useFactory: (engine: Engine) => new Car(engine), deps: [[Engine, new Self()]] }
        { provide: Car, useFactory: (engine: Engine) => new Car(engine), deps: [Engine] }
      ]);

      const child2 = child1.resolveAndCreateChild([
        // { provide: Car, useFactory: (engine: Engine) => new Car(engine), deps: [Engine] }
      ]);

      expect(child2.get(Car) instanceof Car).toBe(true);
      expect(child2.get(Engine) instanceof Engine).toBe(true);
    });

    it('should throw when not requested provider on self', () => {
      const parent = ReflectiveInjector.resolveAndCreate([Engine]);
      const child = parent.resolveAndCreateChild([
        { provide: Car, useFactory: (engine: Engine) => new Car(engine), deps: [[Engine, new Self()]] }
      ]);

      expect(() => child.get(Car)).toThrowError(`No provider for Engine! (${stringify(Car)} -> ${stringify(Engine)})`);
    });
  });

  describe('default', () => {
    it('should not skip self', () => {
      const parent = ReflectiveInjector.resolveAndCreate([Engine]);
      const child = parent.resolveAndCreateChild([
        { provide: Engine, useClass: TurboEngine },
        { provide: Car, useFactory: (engine: Engine) => new Car(engine), deps: [Engine] }
      ]);

      expect(child.get(Car).engine instanceof TurboEngine).toBe(true);
    });
  });
});

describe('@SkipSelf()', () => {
  class Dependency {}

  @Injectable()
  class NeedsDependency {
    constructor(@SkipSelf() public dependency: Dependency) {}
  }

  it('1', () => {
    const parent = ReflectiveInjector.resolveAndCreate([Dependency]);
    const child = parent.resolveAndCreateChild([NeedsDependency]);
    expect(child.get(NeedsDependency).dependency instanceof Dependency).toBe(true);
  });

  it('2', () => {
    const inj = ReflectiveInjector.resolveAndCreate([Dependency, NeedsDependency]);
    expect(() => inj.get(NeedsDependency)).toThrowError();
  });
});

function stringify(token: any): string {
  if (typeof token === 'string') {
    return token;
  }

  if (token == null) {
    return '' + token;
  }

  if (token.overriddenName) {
    return `${token.overriddenName}`;
  }

  if (token.name) {
    return `${token.name}`;
  }

  const res = token.toString();

  if (res == null) {
    return '' + res;
  }

  const newLineIndex = res.indexOf('\n');
  return newLineIndex === -1 ? res : res.substring(0, newLineIndex);
}
