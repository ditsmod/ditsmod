import { injectable, Injector } from '@ts-stack/di';

import { HttpBackend } from '../types/http-interceptor';
import { RouteMeta } from '../types/route-data';

@injectable()
export class DefaultHttpBackend implements HttpBackend {
  constructor(protected injector: Injector) {}

  async handle({ controller, methodName }: RouteMeta) {
    return this.injector.get(controller.prototype[methodName]);
  }
}
