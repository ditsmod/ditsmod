import { Injectable, Injector, Type, InjectionToken } from 'ts-di';

@Injectable()
export class EntityInjector implements Injector {
  protected injector: Injector;

  setInjector(injector: Injector) {
    this.injector = injector;
  }

  get<T>(token: Type<T> | InjectionToken<T>, notFoundValue?: T): T;
  get(token: any, notFoundValue?: any): any;
  get(token: any, notFoundValue: any): any {
    return this.injector.get(token, notFoundValue);
  }
}
