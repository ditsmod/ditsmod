import { Injectable, Injector } from '@ts-stack/di';

import { injectorKey } from '../types/mix';
import { HttpBackend } from '../types/http-interceptor';
import { RouteMeta } from '../types/route-data';

@Injectable()
export class DefaultHttpBackend implements HttpBackend {
  constructor(protected injector: Injector, protected routeMeta: RouteMeta) {}

  async handle() {
    const { controller, methodName } = this.routeMeta;
    const ctrl = this.injector.get(controller);
    ctrl[injectorKey] = this.injector;
    return ctrl[methodName]();
  }
}
