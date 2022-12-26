import { injectable, Injector } from '@ts-stack/di';

import { HttpBackend } from '../types/http-interceptor';
import { RouteMeta } from '../types/route-data';

@injectable()
export class DefaultHttpBackend implements HttpBackend {
  constructor(protected injector: Injector, protected routeMeta: RouteMeta) {}

  async handle() {
    const { controller, methodName } = this.routeMeta;
    return this.injector.get(controller.prototype[methodName]);
  }
}
