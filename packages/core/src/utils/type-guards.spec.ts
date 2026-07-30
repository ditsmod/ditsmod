import { Provider } from '#di/top/types-and-models.js';
import { Extension } from '#extension/extension-types.js';
import { featureModule } from '#decorators/feature-module.js';
import { isProvider, isChainError, isCustomError } from '#utils/type-guards.js';
import { ChainError } from '@ts-stack/chain-error';
import { CustomError } from '#error/custom-error.js';
import { forwardRef, isForwardRef } from '#di/forward-ref.js';
import { rootModule } from '#decorators/root-module.js';
import { Reflector } from '#di/reflector.js';
import { isInjectionToken, isMultiProvider, isNormalizedProvider, type MultiProvider } from '#di/utils.js';
import { InjectionToken } from '#di/top/injection-token.js';

describe('type guards', () => {
  describe('isForwardRef()', () => {
    it('should recognize forwardRef', () => {
      const fn = forwardRef(() => class {});
      expect(isForwardRef(fn)).toBe(true);
    });
  });

  describe('isProvider()', () => {
    it('should recognize all types of providers', () => {
      @featureModule({})
      class Module1 {}
      @rootModule({})
      class Module2 {}

      expect(isProvider(class {})).toBe(true);
      expect(isProvider({ token: '', useValue: '' })).toBe(true);
      expect(isProvider({ token: '' })).toBe(true);
      expect(isProvider(Module1)).toBe(false);
      expect(isProvider(Module2)).toBe(false);
      expect(isProvider({ module: class {} })).toBe(false);
      expect(isProvider(5 as any)).toBe(false);
    });
  });

  describe('isChainError()', () => {
    it('should recognize ChainError', () => {
      const err1 = new ChainError('message');
      const err2 = new Error('message');
      expect(isChainError(err1)).toBe(true);
      expect(isChainError(err2)).toBe(false);
    });
  });

  describe('isCustomError()', () => {
    it('should recognize CustomError', () => {
      const err1 = new CustomError({ msg1: 'message' });
      const err2 = new Error('message');
      expect(isCustomError(err1)).toBe(true);
      expect(isCustomError(err2)).toBe(false);
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
    it('should recognize the InjectionToken', () => {
      const token1 = new InjectionToken('token1');
      const token2 = {};
      class Token3 implements Extension {
        async stage1() {}
      }

      expect(isInjectionToken(token1)).toBe(true);
      expect(isInjectionToken(token2)).toBe(false);
      expect(isInjectionToken(Token3)).toBe(false);
    });
  });

  describe('isMultiProvider()', () => {
    it('should recognize ValueProvider with "useValue"', () => {
      const provider: MultiProvider = { token: 'token', useValue: 'fake', multi: true };
      expect(isMultiProvider(provider)).toBe(true);
    });

    it('should recognize ValueProvider without "useValue"', () => {
      const provider: MultiProvider = { token: 'token', multi: true };
      expect(isMultiProvider(provider)).toBe(true);
    });

    it('should recognize ClassProvider', () => {
      const provider: MultiProvider = { token: 'token', useClass: class {}, multi: true };
      expect(isMultiProvider(provider)).toBe(true);
    });

    it('should recognize TokenProvider', () => {
      const provider: MultiProvider = { token: 'token', useToken: class {}, multi: true };
      expect(isMultiProvider(provider)).toBe(true);
    });

    it('should recognize FactoryProvider', () => {
      const factory = Reflector.makePropDecorator();
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

    it('should fail ValueProvider', () => {
      const provider: Provider = { token: 'token', useValue: 'fake' };
      expect(isMultiProvider(provider)).toBe(false);
    });

    it('should fail ClassProvider', () => {
      const provider: Provider = { token: 'token', useClass: class {} };
      expect(isMultiProvider(provider)).toBe(false);
    });

    it('should fail TokenProvider', () => {
      const provider: Provider = { token: 'token', useToken: class {} };
      expect(isMultiProvider(provider)).toBe(false);
    });

    it('should fail FactoryProvider', () => {
      const factory = Reflector.makePropDecorator();
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
