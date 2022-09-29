import { FactoryProvider, Type } from '@ts-stack/di';

import { LogFilter, LogMediator } from '../services/log-mediator';
import { Logger, LoggerConfig } from '../types/logger';
import { AnyFn, ServiceProvider } from '../types/mix';
import { NormalizedProvider } from './ng-utils';

/**
 * This class has utilites to adding providers to DI in more type safe way.
 * 
 * You can use this as follow:
 * ```ts
  Module({
    // ...
    providersPerMod: [
      ...new Providers()
        .useValue(LoggerConfig, new LoggerConfig('trace'))
        .useClass(SomeService, ExtendedService)
    ],
  })
  export class SomeModule {}
 * ```
 * 
 * ### Plugins
 * 
 * You can even use plugins for this class:
 * 
 * ```ts
  class Plugin1 extends Providers {
    method1() {
      // ...
      return this;
    }
  }

  class Plugin2 extends Providers {
    method2() {
      // ...
      return this;
    }
  }

  ...new Providers()
    .use(Plugin1)
    .use(Plugin2)
    .method1()
    .method2()
    .useLogConfig({ level: 'trace' })
    .useClass(SomeService, ExtendedService)
 * ```
 * 
 * That is, after using the use() method, you will be able to use plugin methods.
 */
export class Providers {
  protected providers: ServiceProvider[] = [];
  protected index = -1;

  useAnyValue<T>(provide: any, useValue: T, multi?: boolean) {
    this.pushProvider({ provide, useValue }, multi);
    return this;
  }

  useValue<T extends Type<any>>(provide: T, useValue: T['prototype'], multi?: boolean) {
    this.pushProvider({ provide, useValue }, multi);
    return this;
  }

  useClass<A extends Type<any>, B extends A>(provide: A, useClass: B, multi?: boolean) {
    this.pushProvider({ provide, useClass }, multi);
    return this;
  }

  useExisting<A extends Type<any>, B extends A>(provide: A, useExisting: B, multi?: boolean) {
    this.pushProvider({ provide, useExisting }, multi);
    return this;
  }

  useFactory(provide: any, useFactory: AnyFn, deps?: any[], multi?: boolean) {
    this.pushProvider({ provide, useFactory }, multi, deps);
    return this;
  }

  useLogger(useLogger: Partial<Logger>, useConfig?: LoggerConfig) {
    this.providers.push({ provide: Logger, useValue: useLogger });
    if (useConfig) {
      this.providers.push({ provide: LoggerConfig, useValue: useConfig });
    }

    return this;
  }

  useLogConfig(useConfig: LoggerConfig, logFilter?: LogFilter) {
    this.providers.push({ provide: LoggerConfig, useValue: useConfig });
    if (logFilter) {
      this.providers.push({ provide: LogFilter, useValue: logFilter });
    }

    return this;
  }

  useLogMediator<T extends Type<LogMediator>>(CustomLogMediator: T) {
    this.providers.push(CustomLogMediator, { provide: LogMediator, useExisting: CustomLogMediator });

    return this;
  }

  use<T extends Type<Providers>>(Plugin: T): T['prototype'] & this {
    Object.getOwnPropertyNames(Plugin.prototype).filter(p => p != 'constructor').forEach(p => {
      (this as any)[p] = Plugin.prototype[p];
    });
    return this;
  }

  protected [Symbol.iterator]() {
    return this;
  }

  protected next() {
    return { value: this.providers[++this.index], done: !(this.index in this.providers) };
  }

  protected pushProvider(provider: NormalizedProvider, multi?: boolean, deps?: any[]) {
    if (multi) {
      provider.multi = multi;
    }
    if (deps) {
      (provider as FactoryProvider).deps = deps;
    }
    this.providers.push(provider);
  }
}
