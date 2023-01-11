import { injectable, Injector, skipSelf } from '../di';
import { HttpBackend } from '../types/http-interceptor';
import { RouteMeta } from '../types/route-data';

@injectable()
export class DefaultHttpBackend implements HttpBackend {
  constructor(protected injector: Injector, @skipSelf() protected routeMeta: RouteMeta) {}

  async handle() {
    return this.injector.instantiateResolved(this.routeMeta.resolvedFactory);
  }
}
