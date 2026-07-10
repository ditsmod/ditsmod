import type { UnionToIntersection } from '#types/mix.js';
import type { AnyFn, Class, FunctionFactoryProvider, Provider, UseFactoryTuple } from '#di/top/types-and-models.js';
import type { NormalizedProvider } from './ng-utils.js';
import { ClassForUseFactoriesWithoutDecorators } from '#error/core-errors.js';
import { Reflector } from '#di/reflector.js';
import type { InjectionToken } from '#di/top/injection-token.js';
import type { InjectionSymbol } from '#di/top/get-symbol.js';

type ProviderToken<T> =
  | InjectionToken<T>
  | Class<T>
  | InjectionSymbol<T>
  | string
  | symbol
  | number
  | NonNullable<unknown>;
/**
 * This class has utilites to adding providers to DI in more type safe way.
 * 
 * You can use this as follow:
 * 
 * ```ts
  Module({
    // ...
    providersPerMod: new ProviderBuilder()
      .useLogConfig({ level: 'debug' })
      .useClass(SomeService, ExtendedService),
  })
  export class SomeModule {}
 * ```
 */
export class ProviderBuilder {
  protected providers: Provider[] = [];
  protected setedIf?: boolean;
  protected ifCondition?: boolean;

  passThrough(provider: Provider) {
    if (this.true) {
      this.providers.push(provider);
    }

    return this.self;
  }

  useValue<T>(token: ProviderToken<T>, useValue: T, multi?: boolean) {
    if (this.true) {
      this.pushProvider({ token, useValue }, multi);
    }

    return this.self;
  }

  useClass<T>(token: ProviderToken<T>, useClass: Class<T>, multi?: boolean) {
    if (this.true) {
      this.pushProvider({ token, useClass }, multi);
    }

    return this.self;
  }

  useToken<T>(token: NonNullable<unknown>, useToken: T, multi?: boolean) {
    if (this.true) {
      this.pushProvider({ token, useToken }, multi);
    }

    return this.self;
  }

  useFactory(token: NonNullable<unknown>, useFactory: AnyFn, deps?: any[], multi?: boolean): this;
  useFactory(token: NonNullable<unknown>, useFactory: UseFactoryTuple, multi?: boolean): this;
  useFactory(
    token: NonNullable<unknown>,
    useFactory: UseFactoryTuple | AnyFn,
    depsOrMulti?: any[] | boolean,
    multi?: boolean,
  ) {
    if (!this.true) {
      return this.self;
    }
    if (Array.isArray(useFactory)) {
      this.pushProvider({ token, useFactory }, depsOrMulti as boolean);
    } else {
      if (depsOrMulti) {
        this.pushProvider({ token, useFactory, deps: depsOrMulti } as FunctionFactoryProvider, multi);
      } else {
        this.pushProvider({ token, useFactory } as FunctionFactoryProvider, multi);
      }
    }

    return this.self;
  }

  /**
   * Each class passed to this method must have at least one method-* or parameter-level decorator.
   */
  useFactories(...Classes: Class<Record<string | symbol, any>>[]) {
    if (!this.true) {
      return this.self;
    }

    Classes.forEach((Cls, i) => {
      const classMeta = Reflector.collectMeta(Cls);
      if (!classMeta) {
        throw new ClassForUseFactoriesWithoutDecorators(i);
      }
      let hasFactoryMethod = false;
      for (const methodName of classMeta) {
        if (methodName == 'constructor') {
          continue;
        }
        for (const decoratorAndValue of classMeta[methodName].decorators) {
          hasFactoryMethod = true;
          this.pushProvider({ useFactory: [Cls, Cls.prototype[methodName]] });
        }
      }
      if (!hasFactoryMethod) {
        throw new ClassForUseFactoriesWithoutDecorators(i);
      }
    });

    return this.self;
  }

  /**
   * ### Conditions
   * 
   * If the `condition` is `true`, then the following expression will work.
   * 
   * __Example 1__
   * 
```ts
const providers = new ProviderBuilder().$if(true).useValue('token', 'value');
[...providers]; // return [{ token: 'token', useValue: 'value' }]
```
   * 
   * __Example 2__
   * 
```ts
const providers = new ProviderBuilder()
  .$if(false)
  .useValue('token1', 'value1')
  .useValue('token2', 'value2');
[...providers]; // return [{ token: 'token2', useValue: 'value2' }]
```
   */
  $if(condition: any) {
    this.setedIf = true;
    this.ifCondition = condition;
    return this;
  }

  /**
 * ### Plugins
 * 
 * This method allows you to dynamically extend this class using plugins:
 * 
 * ```ts
  class Plugin1 extends ProviderBuilder {
    method1() {
      if (this.true) {
        // ...
      }
      return this.self;
    }
  }

  class Plugin2 extends ProviderBuilder {
    method2() {
      if (this.true) {
        // ...
      }
      return this.self;
    }
  }

  const providers = [...new ProviderBuilder()
    .$use(Plugin1, Plugin2)
    .method1()
    .method2()
    .useLogConfig({ level: 'trace' })
    .useClass(SomeService, ExtendedService)];
 * ```
 * 
 * That is, after using the `.$use()` method, you will be able to use plugin methods.
 * As you can see, each plugin method should only add providers if condition of `if (this.true)`
 * is truthy. Additionally, each method must return `this.self`. This should be done so that
 * the `providers.$if()` method works correctly.
 * 
 * __Warning__: Plugins cannot use arrow functions as methods, as they will not work.
 */
  $use<T extends [Class<ProviderBuilder>, ...Class<ProviderBuilder>[]]>(...Plugins: T) {
    Plugins.forEach((Plugin) => {
      Object.getOwnPropertyNames(Plugin.prototype)
        .filter((p) => p != 'constructor')
        .forEach((p) => {
          (this as any)[p] = (Plugin.prototype as any)[p];
        });
    });

    return this.self as UnionToIntersection<InstanceType<T[number]>> & this;
  }

  protected resetIfConditions() {
    this.setedIf = undefined;
    this.ifCondition = undefined;
  }

  protected get true() {
    return !this.setedIf || this.ifCondition;
  }

  protected get self() {
    this.resetIfConditions();
    return this;
  }

  protected [Symbol.iterator]() {
    let counter = 0;
    return {
      next: () => {
        return {
          done: !(counter in this.providers),
          value: this.providers[counter++],
        };
      },
    };
  }

  protected pushProvider(provider: NormalizedProvider, multi?: boolean) {
    if (multi) {
      provider.multi = multi;
    }
    this.providers.push(provider);
  }
}
