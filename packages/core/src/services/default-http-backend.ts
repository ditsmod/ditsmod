import { Injectable, Injector } from '@ts-stack/di';

import { HttpBackend } from '../types/http-interceptor';
import { RouteMeta } from '../types/route-data';

@Injectable()
export class DefaultHttpBackend implements HttpBackend {
  constructor(private injector: Injector, private routeMeta: RouteMeta) {}

  async handle() {
    const { controller, methodName } = this.routeMeta;
    const ctrl = this.injector.get(controller);
    return await ctrl[methodName]();
  }
}
