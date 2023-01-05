import { fromSelf, injectable, Injector } from '../di';
import { HttpBackend } from '../types/http-interceptor';
import { RequestContext } from '../types/route-data';

@injectable()
export class DefaultHttpBackend implements HttpBackend {
  constructor(protected injector: Injector) {}

  async handle(ctx: RequestContext) {
    const { controller, methodName } = ctx.routeMeta;
    return this.injector.get(controller.prototype[methodName], fromSelf);
  }
}
