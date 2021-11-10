import { ReflectiveInjector } from '@ts-stack/di';

 export class InjectorPromise {
  resolveInjector: (value: ReflectiveInjector) => void;
  private promise: Promise<ReflectiveInjector>;

  constructor() {
    this.promise = new Promise<ReflectiveInjector>(resolve => {
      this.resolveInjector = resolve;
    });
  }

  getInjector() {
    return this.promise;
  }
}

/**
 * Injector sibling object.
 */
 export class SiblingObj {
  tokens: any[] = [];
  injectorPromise: Promise<ReflectiveInjector>;
}
