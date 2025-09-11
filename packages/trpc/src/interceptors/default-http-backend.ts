import { injectable, Injector, skipSelf } from '@ditsmod/core';

import { TrpcHttpBackend } from './tokens-and-types.js';
import { TrpcRouteMeta } from '#types/trpc-route-data.js';


@injectable()
export class DefaultTrpcHttpBackend implements TrpcHttpBackend {
  constructor(protected injector: Injector, @skipSelf() protected routeMeta: TrpcRouteMeta) {}

  async handle() {
    return this.injector.instantiateResolved(this.routeMeta.resolvedHandler!);
  }
}
