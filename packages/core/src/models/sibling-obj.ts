import { ReflectiveInjector } from '@ts-stack/di';

/**
 * Injector sibling object.
 */
 export class SiblingObj {
  tokens: any[] = [];
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
