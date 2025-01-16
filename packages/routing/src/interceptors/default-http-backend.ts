import { injectable, Injector, skipSelf } from '@ditsmod/core';

import { RouteMeta } from '../types/route-data.js';
import { HttpBackend } from './tokens-and-types.js';


@injectable()
export class DefaultHttpBackend implements HttpBackend {
  constructor(protected injector: Injector, @skipSelf() protected routeMeta: RouteMeta) {}

  async handle() {
    return this.injector.instantiateResolved(this.routeMeta.resolvedHandler!);
  }
}
