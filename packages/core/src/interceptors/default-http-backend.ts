import { injectable, Injector, skipSelf } from '#di';
import { HttpBackend } from '#interceptors/tokens-and-types.js';
import { RouteMeta } from '#types/route-data.js';

@injectable()
export class DefaultHttpBackend implements HttpBackend {
  constructor(protected injector: Injector, @skipSelf() protected routeMeta: RouteMeta) {}

  async handle() {
    return this.injector.instantiateResolved(this.routeMeta.resolvedHandler!);
  }
}
