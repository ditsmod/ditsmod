import { injectable, Injector, skipSelf } from '@ditsmod/core';

import { HttpBackend } from './tokens-and-types.js';
import { TrpcRouteMeta } from '#types/trpc-route-data.js';


@injectable()
export class DefaultHttpBackend implements HttpBackend {
  constructor(protected injector: Injector, @skipSelf() protected routeMeta: TrpcRouteMeta) {}

  async handle() {
    return this.injector.instantiateResolved(this.routeMeta.resolvedHandler!);
  }
}
