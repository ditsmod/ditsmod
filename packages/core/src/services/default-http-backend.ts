import { fromSelf, injectable, Injector } from '../di';
import { HttpBackend } from '../types/http-interceptor';
import { RequestContext } from '../types/route-data';

@injectable()
export class DefaultHttpBackend implements HttpBackend {
  constructor(protected injector: Injector, @fromSelf() protected ctx: RequestContext) {}

  async handle() {
    return this.injector.instantiateResolved(this.ctx.routeMeta.resolvedFactory);
  }
}
