import { Provider } from '#di/types-and-models.js';
import { Extension } from '#extension/extension-types.js';
import {
  InjectionToken,
  isMultiProvider,
  isNormalizedProvider,
  makePropDecorator,
  isInjectionToken,
  MultiProvider,
  forwardRef,
} from '#di';
import { featureModule } from '#decorators/feature-module.js';
import { isProvider } from '#utils/type-guards.js';
import { isForwardRef } from '#di/forward-ref.js';
import { rootModule } from '#decorators/root-module.js';

describe('type guards', () => {
  it('isForwardRef()', () => {
    const fn = forwardRef(() => class {});
    expect(isForwardRef(fn)).toBe(true);
  });

  describe('isProvider()', () => {
    it('should filtered all types of providers', () => {
      @featureModule({})
      class Module1 {}
      @rootModule({})
      class Module2 {}

      expect(isProvider(class {})).toBe(true);
      expect(isProvider({ token: '', useValue: '' })).toBe(true);
      expect(isProvider({ token: '' })).toBe(true);
      expect(isProvider(Module1)).toBe(false);
      expect(isProvider(Module2)).toBe(false);
      expect(isProvider(5 as any)).toBe(false);
    });
  });

  describe('isNormalizedProvider()', () => {
    it('should recognize all types of providers', () => {
      const providers: Provider[] = [
        { token: '', useValue: '' },
        { token: '' },
        { token: '', useClass: class {} },
        { token: '', useToken: class {} },
        { token: '', useFactory: class {} as any },
      ];
      expect(providers.every(isNormalizedProvider)).toBe(true);
    });

    it('should fail class types of providers', () => {
      const providers: Provider[] = [class {}];
      expect(providers.every(isNormalizedProvider)).toBe(false);
    });

    it('should fail check number', () => {
      const providers: Provider[] = [5 as any];
      expect(providers.every(isNormalizedProvider)).toBe(false);
    });
  });
  describe('isInjectionToken()', () => {
    const token1 = new InjectionToken('token1');
    const token2 = {};
    class token3 implements Extension {
      async stage1() {}
    }

    it('should recognize the InjectionToken', () => {
      expect(isInjectionToken(token1)).toBe(true);
      expect(isInjectionToken(token2)).toBe(false);
      expect(isInjectionToken(token3)).toBe(false);
    });
  });

  describe('isMultiProvider()', () => {
    it('true ValueProvider with "useValue"', () => {
      const provider: MultiProvider = { token: 'token', useValue: 'fake', multi: true };
      expect(isMultiProvider(provider)).toBe(true);
    });
    it('true ValueProvider without "useValue"', () => {
      const provider: MultiProvider = { token: 'token', multi: true };
      expect(isMultiProvider(provider)).toBe(true);
    });

    it('true ClassProvider', () => {
      const provider: MultiProvider = { token: 'token', useClass: class {}, multi: true };
      expect(isMultiProvider(provider)).toBe(true);
    });

    it('true TokenProvider', () => {
      const provider: MultiProvider = { token: 'token', useToken: class {}, multi: true };
      expect(isMultiProvider(provider)).toBe(true);
    });

    it('true FactoryProvider', () => {
      const factory = makePropDecorator();
      class ClassWithDecorators {
        @factory()
        method1() {
          return '';
        }
      }
      const provider: MultiProvider = {
        token: 'token',
        useFactory: [ClassWithDecorators, ClassWithDecorators.prototype.method1],
        multi: true,
      };
      expect(isMultiProvider(provider)).toBe(true);
    });

    it('false ValueProvider', () => {
      const provider: Provider = { token: 'token', useValue: 'fake' };
      expect(isMultiProvider(provider)).toBe(false);
    });

    it('false ClassProvider', () => {
      const provider: Provider = { token: 'token', useClass: class {} };
      expect(isMultiProvider(provider)).toBe(false);
    });

    it('false TokenProvider', () => {
      const provider: Provider = { token: 'token', useToken: class {} };
      expect(isMultiProvider(provider)).toBe(false);
    });

    it('false FactoryProvider', () => {
      const factory = makePropDecorator();
      class ClassWithDecorators {
        @factory()
        method1() {
          return '';
        }
      }
      const provider: Provider = {
        token: 'token',
        useFactory: [ClassWithDecorators, ClassWithDecorators.prototype.method1],
      };
      expect(isMultiProvider(provider)).toBe(false);
    });
  });
});
