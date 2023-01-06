import { fromSelf, injectable, Injector } from '../di';
import { HttpBackend } from '../types/http-interceptor';
import { RequestContext } from '../types/route-data';

@injectable()
export class DefaultHttpBackend implements HttpBackend {
  constructor(protected injector: Injector) {}

  async handle(ctx: RequestContext) {
    const { controller, methodName } = ctx.routeMeta;
    const [factory, args] = this.injector.getFactoryWithArgs(controller.prototype[methodName], 1, fromSelf);
    return factory(ctx, ...args);
  }
}
