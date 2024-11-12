import { HttpBackend, injectable, Injector, skipSelf } from '@ditsmod/core';
import { RouteMeta } from '../route-data.js';


@injectable()
export class DefaultHttpBackend implements HttpBackend {
  constructor(protected injector: Injector, @skipSelf() protected routeMeta: RouteMeta) {}

  async handle() {
    return this.injector.instantiateResolved(this.routeMeta.resolvedHandler!);
  }
}
